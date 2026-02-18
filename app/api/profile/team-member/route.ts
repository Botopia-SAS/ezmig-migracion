import { withAuth } from '@/lib/api/middleware';
import { successResponse, notFoundResponse, handleRouteError } from '@/lib/api/response';
import { db } from '@/lib/db/drizzle';
import { teamMembersProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET = withAuth(async (_request, { user }) => {
  try {
    const [profile] = await db
      .select()
      .from(teamMembersProfiles)
      .where(eq(teamMembersProfiles.userId, user.id))
      .limit(1);

    if (!profile) {
      return notFoundResponse('Team member profile');
    }

    return successResponse(profile);
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch team member profile');
  }
});
