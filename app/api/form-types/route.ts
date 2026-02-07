import { withUser } from '@/lib/api/middleware';
import { successResponse, handleRouteError } from '@/lib/api/response';
import { getFormTypes } from '@/lib/forms/service';

/**
 * GET /api/form-types
 * Get all active form types (USCIS forms catalog)
 */
export const GET = withUser(async () => {
  try {
    const formTypes = await getFormTypes();

    // Return without the full schema for listing
    const simplified = formTypes.map((ft) => ({
      id: ft.id,
      code: ft.code,
      name: ft.name,
      description: ft.description,
      category: ft.category,
      tokenCost: ft.tokenCost,
      estimatedTimeMinutes: ft.estimatedTimeMinutes,
      uscisEdition: ft.uscisEdition,
    }));

    return successResponse({ formTypes: simplified });
  } catch (error) {
    return handleRouteError(error, 'Error fetching form types');
  }
});
