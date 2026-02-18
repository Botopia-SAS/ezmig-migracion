import { withAuth } from '@/lib/api/middleware';
import { successResponse, handleRouteError, notFoundResponse } from '@/lib/api/response';
import { validateBody, requireIntParam } from '@/lib/api/validators';
import {
  getCaseById,
  getCaseWithDetails,
  updateCase,
  deleteCase,
  assignCase,
} from '@/lib/cases/service';
import { notifyCaseStatusChanged, notifyCaseAssigned } from '@/lib/notifications/service';
import { db } from '@/lib/db/drizzle';
import { clients } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateCaseSchema = z.object({
  caseType: z
    .enum([
      'family_based',
      'employment',
      'asylum',
      'naturalization',
      'adjustment',
      'removal_defense',
      'visa',
      'other',
    ])
    .optional(),
  status: z
    .enum(['intake', 'in_progress', 'submitted', 'approved', 'denied', 'closed'])
    .optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  filingDeadline: z.string().nullable().optional(),
  uscisReceiptNumber: z.string().nullable().optional(),
  assignedTo: z.number().int().positive().nullable().optional(),
  internalNotes: z.string().nullable().optional(),
});

export const GET = withAuth(async (request, { teamId }, params) => {
  try {
    const [caseId, err] = requireIntParam(params?.id, 'case ID');
    if (err) return err;

    const { searchParams } = new URL(request.url);
    const includeDetails = searchParams.get('details') === 'true';

    const caseData = includeDetails
      ? await getCaseWithDetails(caseId, teamId)
      : await getCaseById(caseId, teamId);

    if (!caseData) return notFoundResponse('Case');

    return successResponse(caseData);
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch case');
  }
});

export const PUT = withAuth(async (request, { user, teamId }, params) => {
  try {
    const [caseId, err] = requireIntParam(params?.id, 'case ID');
    if (err) return err;

    const existingCase = await getCaseById(caseId, teamId);
    if (!existingCase) return notFoundResponse('Case');

    const body = await request.json();
    const [data, validationError] = validateBody(updateCaseSchema, body);
    if (validationError) return validationError;

    // Handle assignment change
    const assignedTo = data.assignedTo;
    if (assignedTo !== undefined) {
      await assignCase(caseId, teamId, assignedTo, user.id);
      delete data.assignedTo;
    }

    const previousStatus = existingCase.status;
    const updatedCase = await updateCase(caseId, teamId, user.id, data);

    // Notifications (fire-and-forget)
    const caseNumber = existingCase.caseNumber || String(caseId);

    // Resolve client info for notifications
    let clientName = 'Client';
    let clientEmail: string | null = null;
    if (existingCase.clientId) {
      const [client] = await db.select({ firstName: clients.firstName, lastName: clients.lastName, email: clients.email })
        .from(clients).where(eq(clients.id, existingCase.clientId)).limit(1);
      if (client) {
        clientName = `${client.firstName || ''} ${client.lastName || ''}`.trim() || 'Client';
        clientEmail = client.email;
      }
    }

    // Case status changed
    if (data.status && data.status !== previousStatus) {
      notifyCaseStatusChanged(teamId, caseId, caseNumber, clientName, clientEmail, previousStatus, data.status)
        .catch(err => console.error('Failed to notify case status change:', err));
    }

    // Case assigned
    if (assignedTo && assignedTo > 0) {
      notifyCaseAssigned(teamId, caseId, caseNumber, clientName, assignedTo)
        .catch(err => console.error('Failed to notify case assigned:', err));
    }

    return successResponse(updatedCase);
  } catch (error) {
    return handleRouteError(error, 'Failed to update case');
  }
});

export const DELETE = withAuth(async (_request, { user, teamId }, params) => {
  try {
    const [caseId, err] = requireIntParam(params?.id, 'case ID');
    if (err) return err;

    const existingCase = await getCaseById(caseId, teamId);
    if (!existingCase) return notFoundResponse('Case');

    await deleteCase(caseId, teamId, user.id);

    return successResponse({ success: true });
  } catch (error) {
    return handleRouteError(error, 'Failed to delete case');
  }
});
