import { NextRequest, NextResponse } from 'next/server';
import { handleTokenPurchaseSuccess } from '@/lib/payments/stripe';

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get('session_id');

  if (!sessionId) {
    console.error('Token success: Missing session_id');
    return NextResponse.redirect(new URL('/dashboard/billing?error=missing_session', request.url));
  }

  try {
    console.log('Token success: Processing session', sessionId);
    const transaction = await handleTokenPurchaseSuccess(sessionId);
    console.log('Token success: Transaction completed', transaction);

    return NextResponse.redirect(new URL('/dashboard/billing?success=true', request.url));
  } catch (error) {
    console.error('Token success: Error details:', {
      sessionId,
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.redirect(new URL('/dashboard/billing?error=payment_failed', request.url));
  }
}
