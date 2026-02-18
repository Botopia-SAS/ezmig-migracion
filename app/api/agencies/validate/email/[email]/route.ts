import { NextRequest, NextResponse } from 'next/server';
import { validateEmailAvailability } from '@/lib/agencies/service';
import { checkRateLimit, rateLimitResponse, getClientIp, RATE_LIMITS } from '@/lib/api/rate-limit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    // Rate limit by IP
    const ip = getClientIp(request.headers);
    const rl = checkRateLimit(RATE_LIMITS.auth, `ip:${ip}`);
    if (!rl.allowed) {
      return rateLimitResponse(rl.retryAfterMs);
    }

    const { email } = await params;

    // Validación básica de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        available: false,
        email,
        error: 'Invalid email format'
      });
    }

    // Verificar disponibilidad
    const result = await validateEmailAvailability(email);

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error validating email:', error);

    return NextResponse.json({
      available: true,
      email: '',
      error: 'Could not validate email at this time'
    });
  }
}
