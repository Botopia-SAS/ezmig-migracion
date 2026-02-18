import { withAuth } from '@/lib/api/middleware';
import { successResponse, handleRouteError, notFoundResponse } from '@/lib/api/response';
import { requireIntParam } from '@/lib/api/validators';
import { getCaseRelationships } from '@/lib/relationships/service';
import { db } from '@/lib/db/drizzle';
import { cases } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export const GET = withAuth(async (_request, { teamId }, params) => {
  try {
    const [caseId, err] = requireIntParam(params?.id, 'case ID');
    if (err) return err;

    // Verify case belongs to team
    const [caseData] = await db
      .select()
      .from(cases)
      .where(and(eq(cases.id, caseId), eq(cases.teamId, teamId), isNull(cases.deletedAt)));

    if (!caseData) return notFoundResponse('Case');

    // Get relationships for this case
    const relationships = await getCaseRelationships(caseId);

    return successResponse({ relationships });
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch case relationships');
  }
});