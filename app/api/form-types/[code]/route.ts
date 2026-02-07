import { withUser } from '@/lib/api/middleware';
import { successResponse, notFoundResponse, handleRouteError } from '@/lib/api/response';
import { getFormTypeByCode } from '@/lib/forms/service';

/**
 * GET /api/form-types/[code]
 * Get a specific form type with its full schema
 */
export const GET = withUser(async (_req, _user, params) => {
  try {
    const code = params?.code;

    if (!code) {
      return notFoundResponse('Form type');
    }

    const formType = await getFormTypeByCode(code);

    if (!formType) {
      return notFoundResponse('Form type');
    }

    return successResponse(formType);
  } catch (error) {
    return handleRouteError(error, 'Error fetching form type');
  }
});
