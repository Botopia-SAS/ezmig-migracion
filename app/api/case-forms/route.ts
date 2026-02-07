import { withAuth } from '@/lib/api/middleware';
import { successResponse, createdResponse, handleRouteError, badRequestResponse } from '@/lib/api/response';
import { validateBody } from '@/lib/api/validators';
import { createCaseForm, getCaseFormsForCase } from '@/lib/forms/service';
import { z } from 'zod';

const createCaseFormSchema = z.object({
  caseId: z.number().int().positive(),
  formTypeId: z.number().int().positive(),
});

export const GET = withAuth(async (request, { teamId }) => {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    if (!caseId) {
      return badRequestResponse('caseId is required');
    }

    const forms = await getCaseFormsForCase(parseInt(caseId), teamId);

    return successResponse({ forms });
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch case forms');
  }
});

export const POST = withAuth(async (request, { user, teamId }) => {
  try {
    const body = await request.json();
    const [data, validationError] = validateBody(createCaseFormSchema, body);
    if (validationError) return validationError;

    const newForm = await createCaseForm(data, teamId, user.id);

    return createdResponse(newForm);
  } catch (error) {
    return handleRouteError(error, 'Failed to create case form');
  }
});
