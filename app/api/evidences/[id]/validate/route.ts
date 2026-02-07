import { withAuth } from '@/lib/api/middleware';
import { successResponse, handleRouteError } from '@/lib/api/response';
import { validateBody, requireIntParam } from '@/lib/api/validators';
import { validateEvidence } from '@/lib/evidences/service';
import { z } from 'zod';

const validateEvidenceSchema = z.object({
  status: z.enum(['valid', 'invalid', 'needs_review']),
  notes: z.string().optional(),
});

export const POST = withAuth(async (request, { user, teamId }, params) => {
  try {
    const [evidenceId, err] = requireIntParam(params?.id, 'evidence ID');
    if (err) return err;

    const body = await request.json();
    const [data, validationError] = validateBody(validateEvidenceSchema, body);
    if (validationError) return validationError;

    const updatedEvidence = await validateEvidence(
      evidenceId,
      teamId,
      user.id,
      data.status,
      data.notes
    );

    return successResponse(updatedEvidence);
  } catch (error) {
    return handleRouteError(error, 'Failed to validate evidence');
  }
});
