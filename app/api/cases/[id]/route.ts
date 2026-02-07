import { withAuth } from '@/lib/api/middleware';
import { successResponse, handleRouteError, notFoundResponse } from '@/lib/api/response';
import { validateBody, requireIntParam } from '@/lib/api/validators';
import {
  getCaseById,
  getCaseWithDetails,
  updateCase,
  deleteCase,
  assignCase,
} from '@/lib/cases/service';
import { z } from 'zod';

const updateCaseSchema = z.object({
  caseType: z
    .enum([
      'family_based',
      'employment',
      'asylum',
      'naturalization',
      'adjustment',
      'removal_defense',
      'visa',
      'other',
    ])
    .optional(),
  status: z
    .enum(['intake', 'in_progress', 'submitted', 'approved', 'denied', 'closed'])
    .optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  filingDeadline: z.string().nullable().optional(),
  uscisReceiptNumber: z.string().nullable().optional(),
  assignedTo: z.number().int().positive().nullable().optional(),
  internalNotes: z.string().nullable().optional(),
});

export const GET = withAuth(async (request, { teamId }, params) => {
  try {
    const [caseId, err] = requireIntParam(params?.id, 'case ID');
    if (err) return err;

    const { searchParams } = new URL(request.url);
    const includeDetails = searchParams.get('details') === 'true';

    const caseData = includeDetails
      ? await getCaseWithDetails(caseId, teamId)
      : await getCaseById(caseId, teamId);

    if (!caseData) return notFoundResponse('Case');

    return successResponse(caseData);
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch case');
  }
});

export const PUT = withAuth(async (request, { user, teamId }, params) => {
  try {
    const [caseId, err] = requireIntParam(params?.id, 'case ID');
    if (err) return err;

    const existingCase = await getCaseById(caseId, teamId);
    if (!existingCase) return notFoundResponse('Case');

    const body = await request.json();
    const [data, validationError] = validateBody(updateCaseSchema, body);
    if (validationError) return validationError;

    if (data.assignedTo !== undefined) {
      await assignCase(caseId, teamId, data.assignedTo, user.id);
      delete data.assignedTo;
    }

    const updatedCase = await updateCase(caseId, teamId, user.id, data);

    return successResponse(updatedCase);
  } catch (error) {
    return handleRouteError(error, 'Failed to update case');
  }
});

export const DELETE = withAuth(async (_request, { user, teamId }, params) => {
  try {
    const [caseId, err] = requireIntParam(params?.id, 'case ID');
    if (err) return err;

    const existingCase = await getCaseById(caseId, teamId);
    if (!existingCase) return notFoundResponse('Case');

    await deleteCase(caseId, teamId, user.id);

    return successResponse({ success: true });
  } catch (error) {
    return handleRouteError(error, 'Failed to delete case');
  }
});
