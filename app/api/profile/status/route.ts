import { withAuth } from '@/lib/api/middleware';
import { successResponse, handleRouteError } from '@/lib/api/response';
import { db } from '@/lib/db/drizzle';
import { teams, teamMembersProfiles, freelancersProfiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  getAgencyCompletion,
  getTeamMemberCompletion,
  getFreelancerCompletion,
  getNoProfileCompletion,
} from '@/lib/profile/completion';

export const GET = withAuth(async (_request, { user, teamId, tenantRole }) => {
  try {
    const profileType = user.profileType;

    // Owners are always treated as agency (covers legacy users with null profileType)
    if (profileType === 'agency' || tenantRole === 'owner') {
      const [team] = await db
        .select()
        .from(teams)
        .where(eq(teams.id, teamId))
        .limit(1);

      if (!team) {
        return successResponse(getNoProfileCompletion());
      }

      const result = getAgencyCompletion(team as unknown as Record<string, unknown>);
      return successResponse(result);
    }

    if (profileType === 'team_member') {
      const [profile] = await db
        .select()
        .from(teamMembersProfiles)
        .where(eq(teamMembersProfiles.userId, user.id))
        .limit(1);

      if (!profile) {
        return successResponse(getNoProfileCompletion());
      }

      const result = getTeamMemberCompletion(profile as unknown as Record<string, unknown>);
      return successResponse(result);
    }

    if (profileType === 'freelancer') {
      const [profile] = await db
        .select()
        .from(freelancersProfiles)
        .where(eq(freelancersProfiles.userId, user.id))
        .limit(1);

      if (!profile) {
        return successResponse(getNoProfileCompletion());
      }

      const result = getFreelancerCompletion(profile as unknown as Record<string, unknown>);
      return successResponse(result);
    }

    // No profileType set
    return successResponse(getNoProfileCompletion());
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch profile status');
  }
});
