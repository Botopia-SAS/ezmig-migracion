import { NextRequest, NextResponse } from 'next/server';
import { validateEmailAvailability } from '@/lib/agencies/service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
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

    // Siempre devolver 200 - esto es solo para advertencias amigables, no errores
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

// Rate limiting simple para evitar spam
const emailChecks = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60000; // 1 minuto
const MAX_CHECKS_PER_WINDOW = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const checks = emailChecks.get(ip) || 0;

  // Limpiar entradas antiguas
  emailChecks.forEach((timestamp, key) => {
    if (now - timestamp > RATE_LIMIT_WINDOW) {
      emailChecks.delete(key);
    }
  });

  if (checks >= MAX_CHECKS_PER_WINDOW) {
    return true;
  }

  emailChecks.set(ip, checks + 1);
  return false;
}