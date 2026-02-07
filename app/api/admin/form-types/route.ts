import { withAdmin } from '@/lib/api/middleware';
import { successResponse, handleRouteError, validationErrorResponse, conflictResponse, createdResponse } from '@/lib/api/response';
import { getAllFormTypes, createFormType } from '@/lib/admin/form-types-service';
import { z } from 'zod';

const createSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  category: z.string().max(50).optional(),
  uscisEdition: z.string().max(50).optional(),
  tokenCost: z.number().int().min(0).default(1),
  estimatedTimeMinutes: z.number().int().min(0).optional(),
});

export const GET = withAdmin(async () => {
  try {
    const types = await getAllFormTypes();
    return successResponse(types);
  } catch (error) {
    return handleRouteError(error, 'Error fetching form types');
  }
});

export const POST = withAdmin(async (req) => {
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return validationErrorResponse(parsed.error);
    }

    const formType = await createFormType(parsed.data);
    return createdResponse(formType);
  } catch (error) {
    if (error instanceof Error && error.message.includes('unique')) {
      return conflictResponse('A form type with this code already exists');
    }
    return handleRouteError(error, 'Error creating form type');
  }
});
