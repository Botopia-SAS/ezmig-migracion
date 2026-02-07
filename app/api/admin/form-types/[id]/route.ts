import { withAdmin } from '@/lib/api/middleware';
import {
  successResponse,
  handleRouteError,
  notFoundResponse,
  badRequestResponse,
  validationErrorResponse,
} from '@/lib/api/response';
import { parseIntParam } from '@/lib/api/validators';
import {
  getFormTypeByIdAdmin,
  updateFormType,
  deleteFormType,
  duplicateFormType,
} from '@/lib/admin/form-types-service';
import { z } from 'zod';

const updateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  category: z.string().max(50).optional(),
  uscisEdition: z.string().max(50).optional(),
  tokenCost: z.number().int().min(0).optional(),
  estimatedTimeMinutes: z.number().int().min(0).optional(),
  formSchema: z.any().optional(),
  isActive: z.boolean().optional(),
});

export const GET = withAdmin(async (_req, _user, params) => {
  try {
    const id = parseIntParam(params?.id);
    if (id === null) return badRequestResponse('Invalid form type ID');

    const formType = await getFormTypeByIdAdmin(id);
    if (!formType) return notFoundResponse('Form type');

    return successResponse(formType);
  } catch (error) {
    return handleRouteError(error, 'Error fetching form type');
  }
});

export const PUT = withAdmin(async (req, _user, params) => {
  try {
    const id = parseIntParam(params?.id);
    if (id === null) return badRequestResponse('Invalid form type ID');

    const existing = await getFormTypeByIdAdmin(id);
    if (!existing) return notFoundResponse('Form type');

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return validationErrorResponse(parsed.error);

    const updated = await updateFormType(id, parsed.data);
    return successResponse(updated);
  } catch (error) {
    return handleRouteError(error, 'Error updating form type');
  }
});

export const DELETE = withAdmin(async (_req, _user, params) => {
  try {
    const id = parseIntParam(params?.id);
    if (id === null) return badRequestResponse('Invalid form type ID');

    const existing = await getFormTypeByIdAdmin(id);
    if (!existing) return notFoundResponse('Form type');

    const result = await deleteFormType(id);
    return successResponse(result);
  } catch (error) {
    return handleRouteError(error, 'Error deleting form type');
  }
});
