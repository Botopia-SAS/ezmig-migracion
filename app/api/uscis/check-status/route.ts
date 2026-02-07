import { withAuth } from '@/lib/api/middleware';
import { successResponse, handleRouteError, notFoundResponse, badRequestResponse, errorResponse } from '@/lib/api/response';
import { validateBody } from '@/lib/api/validators';
import { getCaseById } from '@/lib/cases/service';
import {
  checkCaseStatus,
  validateReceiptNumber,
  isUSCISApiConfigured,
  getTrackedCasesForCase,
} from '@/lib/uscis/case-tracker';
import { z } from 'zod';

const checkStatusSchema = z.object({
  caseId: z.number().int().positive(),
  receiptNumber: z.string().optional(),
});

export const POST = withAuth(async (request, { teamId }) => {
  try {
    const body = await request.json();
    const [data, validationError] = validateBody(checkStatusSchema, body);
    if (validationError) return validationError;

    const { caseId, receiptNumber: providedReceiptNumber } = data;

    const caseData = await getCaseById(caseId, teamId);
    if (!caseData) return notFoundResponse('Case');

    const receiptNumber = providedReceiptNumber || caseData.uscisReceiptNumber;

    if (!receiptNumber) {
      return badRequestResponse('No USCIS receipt number provided or associated with this case');
    }

    if (!validateReceiptNumber(receiptNumber)) {
      return badRequestResponse('Invalid receipt number format. Expected format: 3 letters + 10 digits (e.g., EAC9999103403)');
    }

    if (!isUSCISApiConfigured()) {
      return errorResponse(
        'USCIS API not configured. Please configure USCIS_CLIENT_ID and USCIS_CLIENT_SECRET environment variables',
        503
      );
    }

    const status = await checkCaseStatus(receiptNumber, caseId);

    return successResponse({ success: true, data: status });
  } catch (error) {
    return handleRouteError(error, 'Failed to check USCIS status');
  }
});

export const GET = withAuth(async (request, { teamId }) => {
  try {
    const { searchParams } = new URL(request.url);
    const caseIdStr = searchParams.get('caseId');

    if (!caseIdStr) {
      return badRequestResponse('caseId query parameter is required');
    }

    const caseId = parseInt(caseIdStr);
    if (isNaN(caseId)) {
      return badRequestResponse('Invalid case ID');
    }

    const caseData = await getCaseById(caseId, teamId);
    if (!caseData) return notFoundResponse('Case');

    const trackedStatuses = await getTrackedCasesForCase(caseId);

    return successResponse({
      success: true,
      receiptNumber: caseData.uscisReceiptNumber,
      apiConfigured: isUSCISApiConfigured(),
      data: trackedStatuses,
    });
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch USCIS status');
  }
});
