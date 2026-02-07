import { withAuth, withStaffOrOwner } from '@/lib/api/middleware';
import { successResponse, createdResponse, handleRouteError } from '@/lib/api/response';
import { validateBody } from '@/lib/api/validators';
import { createCase, getCasesForTeam } from '@/lib/cases/service';
import { z } from 'zod';

const createCaseSchema = z.object({
  clientId: z.number().int().positive(),
  caseType: z.enum([
    'family_based',
    'employment',
    'asylum',
    'naturalization',
    'adjustment',
    'removal_defense',
    'visa',
    'other',
  ]),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  filingDeadline: z.string().optional(),
  assignedTo: z.number().int().positive().optional(),
  internalNotes: z.string().optional(),
});

export const GET = withAuth(async (request, { user, teamId, tenantRole }) => {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const caseType = searchParams.get('caseType') || undefined;
    const clientId = searchParams.get('clientId');
    const requestedAssignedTo = searchParams.get('assignedTo');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const isStaffOnly = tenantRole === 'staff';
    const effectiveAssignedTo = isStaffOnly
      ? user.id
      : requestedAssignedTo
        ? parseInt(requestedAssignedTo)
        : undefined;

    const result = await getCasesForTeam(teamId, {
      search,
      status,
      caseType,
      clientId: clientId ? parseInt(clientId) : undefined,
      assignedTo: effectiveAssignedTo,
      limit,
      offset,
    });

    return successResponse({
      ...result,
      _meta: {
        filteredByAssignment: isStaffOnly,
        userId: isStaffOnly ? user.id : undefined,
      },
    });
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch cases');
  }
});

export const POST = withStaffOrOwner(async (request, { user, teamId }) => {
  try {
    const body = await request.json();
    const [data, validationError] = validateBody(createCaseSchema, body);
    if (validationError) return validationError;

    const newCase = await createCase({
      teamId,
      createdBy: user.id,
      ...data,
    });

    return createdResponse(newCase);
  } catch (error) {
    return handleRouteError(error, 'Failed to create case');
  }
});
