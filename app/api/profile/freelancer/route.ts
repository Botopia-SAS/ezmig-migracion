import { withAuth } from '@/lib/api/middleware';
import { successResponse, notFoundResponse, handleRouteError } from '@/lib/api/response';
import { db } from '@/lib/db/drizzle';
import { freelancersProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET = withAuth(async (_request, { user }) => {
  try {
    const [profile] = await db
      .select()
      .from(freelancersProfiles)
      .where(eq(freelancersProfiles.userId, user.id))
      .limit(1);

    if (!profile) {
      return notFoundResponse('Freelancer profile');
    }

    return successResponse(profile);
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch freelancer profile');
  }
});
