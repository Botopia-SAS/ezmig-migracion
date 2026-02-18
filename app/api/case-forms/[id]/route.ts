import { withAuth } from '@/lib/api/middleware';
import { successResponse, handleRouteError, notFoundResponse } from '@/lib/api/response';
import { validateBody, requireIntParam } from '@/lib/api/validators';
import {
  getCaseFormById,
  updateCaseForm,
  deleteCaseForm,
  getAutosavedFields,
} from '@/lib/forms/service';
import { notifyFormCompleted, notifyFormSubmitted } from '@/lib/notifications/service';
import { generatePdf } from '@/lib/pdf/generation-service';
import { z } from 'zod';

const updateCaseFormSchema = z.object({
  formData: z.record(z.unknown()).optional(),
  status: z
    .enum(['not_started', 'in_progress', 'completed', 'submitted'])
    .optional(),
  progressPercentage: z.number().int().min(0).max(100).optional(),
});

export const GET = withAuth(async (_request, { teamId }, params) => {
  try {
    const [caseFormId, err] = requireIntParam(params?.id, 'case form ID');
    if (err) return err;

    const caseForm = await getCaseFormById(caseFormId, teamId);
    if (!caseForm) return notFoundResponse('Case form');

    const autosavedFields = await getAutosavedFields(caseFormId);

    return successResponse({
      ...caseForm,
      autosavedFields,
    });
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch case form');
  }
});

export const PUT = withAuth(async (request, { user, teamId }, params) => {
  try {
    const [caseFormId, err] = requireIntParam(params?.id, 'case form ID');
    if (err) return err;

    const body = await request.json();
    const [data, validationError] = validateBody(updateCaseFormSchema, body);
    if (validationError) return validationError;

    const updatedForm = await updateCaseForm(caseFormId, teamId, user.id, data);

    // Send notifications for status changes (fire-and-forget)
    if (data.status === 'completed' || data.status === 'submitted') {
      const caseForm = await getCaseFormById(caseFormId, teamId);
      if (caseForm) {
        const clientName = caseForm.client
          ? `${caseForm.client.firstName || ''} ${caseForm.client.lastName || ''}`.trim() || 'Client'
          : 'Client';
        const caseNumber = caseForm.case.caseNumber || String(caseForm.case.id);

        if (data.status === 'completed') {
          notifyFormCompleted(teamId, caseForm.case.id, caseForm.formType.code, clientName, caseNumber)
            .catch(err => console.error('Failed to notify form completed:', err));

          // Auto-generate PDF on form completion (fire-and-forget)
          generatePdf(caseFormId, teamId, user.id)
            .catch(err => console.error('Failed to auto-generate PDF:', err));
        } else {
          notifyFormSubmitted(teamId, caseForm.case.id, caseForm.formType.code, clientName, caseForm.client?.email || '', caseNumber)
            .catch(err => console.error('Failed to notify form submitted:', err));
        }
      }
    }

    return successResponse(updatedForm);
  } catch (error) {
    return handleRouteError(error, 'Failed to update case form');
  }
});

export const DELETE = withAuth(async (_request, { user, teamId }, params) => {
  try {
    const [caseFormId, err] = requireIntParam(params?.id, 'case form ID');
    if (err) return err;

    await deleteCaseForm(caseFormId, teamId, user.id);

    return successResponse({ success: true });
  } catch (error) {
    return handleRouteError(error, 'Failed to delete case form');
  }
});
