import { withOwner } from '@/lib/api/middleware';
import { successResponse, handleRouteError, badRequestResponse, notFoundResponse } from '@/lib/api/response';
import { createTokenCheckoutSession } from '@/lib/payments/stripe';
import { db } from '@/lib/db/drizzle';
import { teams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const POST = withOwner(async (request, { user, teamId }) => {
  try {
    const body = await request.json();
    const { packageId } = body;

    if (!packageId) {
      return badRequestResponse('Package ID is required');
    }

    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (!team) return notFoundResponse('Team');

    const session = await createTokenCheckoutSession({
      team,
      packageId: parseInt(packageId),
      userId: user.id,
    });

    return successResponse({ url: session.url });
  } catch (error) {
    return handleRouteError(error, 'Failed to create checkout session');
  }
});
