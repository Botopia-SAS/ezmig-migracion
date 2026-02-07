import { withAuth } from '@/lib/api/middleware';
import { successResponse, handleRouteError, notFoundResponse } from '@/lib/api/response';
import { validateBody, requireIntParam } from '@/lib/api/validators';
import { getEvidenceById, updateEvidence, deleteEvidence } from '@/lib/evidences/service';
import { z } from 'zod';

const updateEvidenceSchema = z.object({
  category: z.string().optional(),
  subcategory: z.string().optional(),
  documentDate: z.string().nullable().optional(),
  validationStatus: z.enum(['pending', 'valid', 'invalid', 'needs_review']).optional(),
  validationNotes: z.string().nullable().optional(),
});

export const GET = withAuth(async (_request, { teamId }, params) => {
  try {
    const [evidenceId, err] = requireIntParam(params?.id, 'evidence ID');
    if (err) return err;

    const evidence = await getEvidenceById(evidenceId, teamId);
    if (!evidence) return notFoundResponse('Evidence');

    return successResponse(evidence);
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch evidence');
  }
});

export const PUT = withAuth(async (request, { user, teamId }, params) => {
  try {
    const [evidenceId, err] = requireIntParam(params?.id, 'evidence ID');
    if (err) return err;

    const body = await request.json();
    const [data, validationError] = validateBody(updateEvidenceSchema, body);
    if (validationError) return validationError;

    const updatedEvidence = await updateEvidence(evidenceId, teamId, user.id, data);

    return successResponse(updatedEvidence);
  } catch (error) {
    return handleRouteError(error, 'Failed to update evidence');
  }
});

export const DELETE = withAuth(async (_request, { user, teamId }, params) => {
  try {
    const [evidenceId, err] = requireIntParam(params?.id, 'evidence ID');
    if (err) return err;

    await deleteEvidence(evidenceId, teamId, user.id);

    return successResponse({ success: true });
  } catch (error) {
    return handleRouteError(error, 'Failed to delete evidence');
  }
});
