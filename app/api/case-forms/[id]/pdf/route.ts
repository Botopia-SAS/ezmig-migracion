import { withAuth } from '@/lib/api/middleware';
import {
  successResponse,
  createdResponse,
  handleRouteError,
  notFoundResponse,
} from '@/lib/api/response';
import { requireIntParam } from '@/lib/api/validators';
import {
  generatePdf,
  getLatestPdfVersion,
  getPdfVersions,
} from '@/lib/pdf/generation-service';

/**
 * GET /api/case-forms/[id]/pdf
 * Returns latest PDF version info (or null if none generated yet).
 */
export const GET = withAuth(async (_request, { teamId }, params) => {
  try {
    const [caseFormId, err] = requireIntParam(params?.id, 'case form ID');
    if (err) return err;

    const latest = await getLatestPdfVersion(caseFormId, teamId);

    if (!latest) {
      return successResponse({ hasPdf: false, latestVersion: null });
    }

    return successResponse({
      hasPdf: true,
      latestVersion: {
        id: latest.id,
        fileUrl: latest.fileUrl,
        fileSize: latest.fileSize,
        version: latest.version,
        isFinal: latest.isFinal,
        generatedAt: latest.generatedAt,
      },
    });
  } catch (error) {
    return handleRouteError(error, 'Failed to get PDF info');
  }
});

/**
 * POST /api/case-forms/[id]/pdf
 * Generate a new PDF version from current form data.
 */
export const POST = withAuth(async (_request, { user, teamId }, params) => {
  try {
    const [caseFormId, err] = requireIntParam(params?.id, 'case form ID');
    if (err) return err;

    const result = await generatePdf(caseFormId, teamId, user.id);

    return createdResponse(result);
  } catch (error) {
    return handleRouteError(error, 'Failed to generate PDF');
  }
});
