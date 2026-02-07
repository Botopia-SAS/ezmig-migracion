import { withAuth } from '@/lib/api/middleware';
import { successResponse, handleRouteError } from '@/lib/api/response';
import { validateBody, requireIntParam } from '@/lib/api/validators';
import { autosaveField } from '@/lib/forms/service';
import { z } from 'zod';

const autosaveSchema = z.object({
  fieldPath: z.string().min(1),
  fieldValue: z.string().nullable(),
});

export const POST = withAuth(async (request, { user, teamId }, params) => {
  try {
    const [caseFormId, err] = requireIntParam(params?.id, 'case form ID');
    if (err) return err;

    const body = await request.json();
    const [data, validationError] = validateBody(autosaveSchema, body);
    if (validationError) return validationError;

    await autosaveField(caseFormId, teamId, user.id, data.fieldPath, data.fieldValue);

    return successResponse({ success: true, savedAt: new Date().toISOString() });
  } catch (error) {
    return handleRouteError(error, 'Failed to autosave field');
  }
});
