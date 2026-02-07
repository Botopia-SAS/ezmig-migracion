import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hashPassword, setSession } from '@/lib/auth/session';
import {
  getReferralLinkByCode,
  useReferralLinkForRegistration,
} from '@/lib/referrals/service';
import { notifyClientRegistered } from '@/lib/notifications/service';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
  referralCode: z.string().min(6),
  dateOfBirth: z.string().optional(),
  countryOfBirth: z.string().optional(),
  nationality: z.string().optional(),
  alienNumber: z.string().optional(),
});

/**
 * POST /api/auth/register-with-referral
 * Register a new end user via referral link.
 * Creates user + client + case (if needed) + case_forms atomically.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { email, password, name, referralCode, dateOfBirth, countryOfBirth, nationality, alienNumber } =
      validationResult.data;

    // Get link info for notification context
    const linkInfo = await getReferralLinkByCode(referralCode);
    if (!linkInfo) {
      return NextResponse.json(
        { error: 'Referral link not found' },
        { status: 404 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Extract metadata
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const userAgent = request.headers.get('user-agent');

    // Delegate everything to the service (runs in a transaction)
    const result = await useReferralLinkForRegistration(
      referralCode,
      {
        email,
        name,
        passwordHash,
        dateOfBirth,
        countryOfBirth,
        nationality,
        alienNumber,
      },
      {
        ipAddress: ipAddress || undefined,
        userAgent: userAgent || undefined,
      }
    );

    if (!result.success || !result.user) {
      const status = result.error === 'Email already registered' ? 409 : 400;
      return NextResponse.json(
        { error: result.error || 'Registration failed' },
        { status }
      );
    }

    // Notify team owners about the new registration
    await notifyClientRegistered(
      linkInfo.teamId,
      name,
      email,
      result.case?.id
    );

    // Set session for the new user
    await setSession(result.user);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error registering user with referral:', error);
    return NextResponse.json(
      { error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
