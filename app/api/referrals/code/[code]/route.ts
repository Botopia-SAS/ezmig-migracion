import { NextRequest, NextResponse } from 'next/server';
import {
  getReferralLinkByCode,
  recordReferralLinkUsage,
  validateReferralLink,
} from '@/lib/referrals/service';

interface RouteParams {
  params: Promise<{ code: string }>;
}

/**
 * GET /api/referrals/code/[code]
 * Get public info for a referral link (for portal)
 * This is a PUBLIC endpoint - no auth required
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;

    if (!code || code.length < 6) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
    }

    const linkInfo = await getReferralLinkByCode(code);

    if (!linkInfo) {
      return NextResponse.json({ error: 'Referral link not found' }, { status: 404 });
    }

    // Record the visit (without user since they're not logged in yet)
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
    const userAgent = request.headers.get('user-agent');

    await recordReferralLinkUsage(linkInfo.id, 'visited', undefined, {
      ipAddress: ipAddress || undefined,
      userAgent: userAgent || undefined,
    });

    return NextResponse.json({ link: linkInfo });
  } catch (error) {
    console.error('Error fetching referral link by code:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral link' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/referrals/code/[code]/validate
 * Validate a referral code before registration
 * This is a PUBLIC endpoint - no auth required
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;

    if (!code || code.length < 6) {
      return NextResponse.json({ error: 'Invalid referral code' }, { status: 400 });
    }

    const validation = await validateReferralLink(code);

    return NextResponse.json({
      valid: validation.valid,
      reason: validation.reason,
    });
  } catch (error) {
    console.error('Error validating referral link:', error);
    return NextResponse.json(
      { error: 'Failed to validate referral link' },
      { status: 500 }
    );
  }
}
