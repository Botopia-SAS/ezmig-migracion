import { withAuth, withOwner } from '@/lib/api/middleware';
import { successResponse, handleRouteError } from '@/lib/api/response';
import { updateAutoReloadSettings } from '@/lib/tokens/service';
import { db } from '@/lib/db/drizzle';
import { teams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET = withAuth(async (_request, { teamId, tenantRole }) => {
  try {
    const [team] = await db
      .select({
        autoReloadEnabled: teams.autoReloadEnabled,
        autoReloadThreshold: teams.autoReloadThreshold,
        autoReloadPackage: teams.autoReloadPackage,
        stripeCustomerId: teams.stripeCustomerId,
      })
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    return successResponse({
      enabled: team?.autoReloadEnabled ?? false,
      threshold: team?.autoReloadThreshold ?? 5,
      package: team?.autoReloadPackage ?? '10',
      hasPaymentMethod: !!team?.stripeCustomerId,
      isOwner: tenantRole === 'owner',
    });
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch auto-reload settings');
  }
});

export const POST = withOwner(async (request, { user, teamId }) => {
  try {
    const body = await request.json();
    const { enabled, threshold, package: packageTokens } = body;

    await updateAutoReloadSettings({
      teamId,
      enabled: enabled ?? false,
      threshold: threshold ?? 5,
      packageTokens: packageTokens ?? '10',
      userId: user.id,
    });

    return successResponse({ success: true });
  } catch (error) {
    return handleRouteError(error, 'Failed to update auto-reload settings');
  }
});
