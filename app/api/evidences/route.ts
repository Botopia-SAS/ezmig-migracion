import { withAuth } from '@/lib/api/middleware';
import { successResponse, createdResponse, handleRouteError, badRequestResponse } from '@/lib/api/response';
import { validateBody } from '@/lib/api/validators';
import { createEvidence, getEvidencesForCase } from '@/lib/evidences/service';
import { z } from 'zod';

const createEvidenceSchema = z.object({
  caseId: z.coerce.number().int().positive(),
  caseFormId: z.coerce.number().int().positive().optional(),
  fieldPath: z.string().optional(),
  fileName: z.string().min(1),
  fileType: z.string().optional(),
  fileSize: z.coerce.number().int().positive().optional(),
  fileUrl: z.string().url(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  documentDate: z.string().optional(),
});

export const GET = withAuth(async (request, { teamId }) => {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    if (!caseId) {
      return badRequestResponse('caseId is required');
    }

    const filters = {
      caseFormId: searchParams.get('caseFormId')
        ? parseInt(searchParams.get('caseFormId')!)
        : undefined,
      fieldPath: searchParams.get('fieldPath') || undefined,
      category: searchParams.get('category') || undefined,
      validationStatus: searchParams.get('validationStatus') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const result = await getEvidencesForCase(parseInt(caseId), teamId, filters);

    return successResponse(result);
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch evidences');
  }
});

export const POST = withAuth(async (request, { user, teamId }) => {
  try {
    const body = await request.json();
    const [data, validationError] = validateBody(createEvidenceSchema, body);
    if (validationError) return validationError;

    const evidence = await createEvidence(data, teamId, user.id);

    return createdResponse(evidence);
  } catch (error) {
    return handleRouteError(error, 'Failed to create evidence');
  }
});
