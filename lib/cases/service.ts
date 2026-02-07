import { db } from '@/lib/db/drizzle';
import {
  cases,
  clients,
  caseForms,
  formTypes,
  users,
  evidences,
  ActivityType,
} from '@/lib/db/schema';
import { alias } from 'drizzle-orm/pg-core';
import type { Case } from '@/lib/db/schema';
import { eq, and, desc, sql, like, or, isNull, asc } from 'drizzle-orm';
import { logActivity, detectChanges } from '@/lib/activity';
import { TRACKABLE_CASE_FIELDS } from '@/lib/activity/constants';

// Types
export interface CreateCaseInput {
  teamId: number;
  clientId: number;
  caseType: string;
  priority?: string;
  filingDeadline?: string;
  assignedTo?: number;
  internalNotes?: string;
  createdBy: number;
}

export interface UpdateCaseInput {
  caseType?: string;
  status?: string;
  priority?: string;
  filingDeadline?: string | null;
  assignedTo?: number | null;
  uscisReceiptNumber?: string | null;
  internalNotes?: string | null;
}

export interface CaseFilters {
  search?: string;
  status?: string;
  caseType?: string;
  clientId?: number;
  assignedTo?: number;
  limit?: number;
  offset?: number;
}

// Generate case number
async function generateCaseNumber(teamId: number): Promise<string> {
  const year = new Date().getFullYear();

  const [lastCase] = await db
    .select({ caseNumber: cases.caseNumber })
    .from(cases)
    .where(eq(cases.teamId, teamId))
    .orderBy(desc(cases.id))
    .limit(1);

  let nextNumber = 1;
  if (lastCase?.caseNumber) {
    const parts = lastCase.caseNumber.split('-');
    if (parts.length >= 3) {
      const lastNumber = parseInt(parts[2], 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }
  }

  return `EZM-${year}-${String(nextNumber).padStart(5, '0')}`;
}

// Create a new case
export async function createCase(input: CreateCaseInput) {
  const caseNumber = await generateCaseNumber(input.teamId);

  const [newCase] = await db
    .insert(cases)
    .values({
      teamId: input.teamId,
      clientId: input.clientId,
      caseNumber,
      caseType: input.caseType as any,
      status: 'intake',
      priority: (input.priority as any) || 'normal',
      filingDeadline: input.filingDeadline || null,
      assignedTo: input.assignedTo || null,
      internalNotes: input.internalNotes || null,
      createdBy: input.createdBy,
    })
    .returning();

  // Log activity
  await logCaseActivity(input.teamId, input.createdBy, ActivityType.CREATE_CASE, newCase);

  return newCase;
}

// Get case by ID
export async function getCaseById(caseId: number, teamId: number) {
  const [caseData] = await db
    .select()
    .from(cases)
    .where(
      and(
        eq(cases.id, caseId),
        eq(cases.teamId, teamId),
        isNull(cases.deletedAt)
      )
    );

  return caseData;
}

// Get case with related data
export async function getCaseWithDetails(caseId: number, teamId: number) {
  // Create aliases for users table to join for both assignedTo and createdBy
  const assignedUser = alias(users, 'assigned_user');
  const createdByUser = alias(users, 'created_by_user');

  const [caseData] = await db
    .select({
      case: cases,
      client: clients,
      assignedUser: {
        id: assignedUser.id,
        name: assignedUser.name,
        email: assignedUser.email,
      },
      createdBy: {
        id: createdByUser.id,
        name: createdByUser.name,
        email: createdByUser.email,
      },
    })
    .from(cases)
    .leftJoin(clients, eq(cases.clientId, clients.id))
    .leftJoin(assignedUser, eq(cases.assignedTo, assignedUser.id))
    .leftJoin(createdByUser, eq(cases.createdBy, createdByUser.id))
    .where(
      and(
        eq(cases.id, caseId),
        eq(cases.teamId, teamId),
        isNull(cases.deletedAt)
      )
    );

  if (!caseData) return null;

  // Get forms for this case with formType data
  const formsData = await db
    .select({
      caseForm: caseForms,
      formType: formTypes,
    })
    .from(caseForms)
    .innerJoin(formTypes, eq(caseForms.formTypeId, formTypes.id))
    .where(eq(caseForms.caseId, caseId));

  const forms = formsData.map((f) => ({
    ...f.caseForm,
    formType: f.formType,
  }));

  // Get evidences for this case with uploader info
  const uploadedByUser = alias(users, 'uploaded_by_user');
  const evidencesData = await db
    .select({
      evidence: evidences,
      uploadedByUser: {
        id: uploadedByUser.id,
        name: uploadedByUser.name,
        email: uploadedByUser.email,
      },
    })
    .from(evidences)
    .leftJoin(uploadedByUser, eq(evidences.uploadedBy, uploadedByUser.id))
    .where(eq(evidences.caseId, caseId));

  const evidencesList = evidencesData.map((e) => ({
    ...e.evidence,
    uploadedByUser: e.uploadedByUser,
  }));

  return {
    ...caseData.case,
    client: caseData.client,
    assignedUser: caseData.assignedUser?.id ? caseData.assignedUser : null,
    createdBy: caseData.createdBy?.id ? caseData.createdBy : null,
    forms,
    evidences: evidencesList,
  };
}

// Get cases for team with filters
export async function getCasesForTeam(teamId: number, filters: CaseFilters = {}) {
  const { search, status, caseType, clientId, assignedTo, limit = 50, offset = 0 } = filters;

  const conditions = [eq(cases.teamId, teamId), isNull(cases.deletedAt)];

  if (status) {
    conditions.push(eq(cases.status, status as any));
  }

  if (caseType) {
    conditions.push(eq(cases.caseType, caseType as any));
  }

  if (clientId) {
    conditions.push(eq(cases.clientId, clientId));
  }

  if (assignedTo) {
    conditions.push(eq(cases.assignedTo, assignedTo));
  }

  // Base query
  let query = db
    .select({
      case: cases,
      client: {
        id: clients.id,
        firstName: clients.firstName,
        lastName: clients.lastName,
        email: clients.email,
      },
      assignedUser: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(cases)
    .leftJoin(clients, eq(cases.clientId, clients.id))
    .leftJoin(users, eq(cases.assignedTo, users.id))
    .where(and(...conditions))
    .orderBy(desc(cases.createdAt))
    .limit(limit)
    .offset(offset);

  const casesData = await query;

  // Apply search filter after join (search on client name or case number)
  let filteredCases = casesData;
  if (search) {
    const searchLower = search.toLowerCase();
    filteredCases = casesData.filter(
      (c) =>
        c.case.caseNumber?.toLowerCase().includes(searchLower) ||
        c.client?.firstName?.toLowerCase().includes(searchLower) ||
        c.client?.lastName?.toLowerCase().includes(searchLower) ||
        `${c.client?.firstName} ${c.client?.lastName}`.toLowerCase().includes(searchLower)
    );
  }

  // Get total count
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(cases)
    .where(and(...conditions));

  return {
    cases: filteredCases.map((c) => ({
      ...c.case,
      client: c.client,
      assignedUser: c.assignedUser,
    })),
    total: Number(countResult?.count || 0),
    limit,
    offset,
  };
}

// Update case
export async function updateCase(
  caseId: number,
  teamId: number,
  userId: number,
  data: UpdateCaseInput
) {
  const existingCase = await getCaseById(caseId, teamId);
  if (!existingCase) return null;

  const updateData: Record<string, unknown> = { updatedAt: new Date() };

  if (data.caseType !== undefined) updateData.caseType = data.caseType;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.filingDeadline !== undefined) updateData.filingDeadline = data.filingDeadline;
  if (data.assignedTo !== undefined) updateData.assignedTo = data.assignedTo;
  if (data.uscisReceiptNumber !== undefined) updateData.uscisReceiptNumber = data.uscisReceiptNumber;
  if (data.internalNotes !== undefined) updateData.internalNotes = data.internalNotes;

  const [updatedCase] = await db
    .update(cases)
    .set(updateData)
    .where(and(eq(cases.id, caseId), eq(cases.teamId, teamId)))
    .returning();

  if (updatedCase) {
    // Detect changes - cast to compatible type
    const changes = detectChanges(
      existingCase as Record<string, unknown>,
      data as Record<string, unknown>,
      [...TRACKABLE_CASE_FIELDS]
    );
    await logCaseActivity(teamId, userId, ActivityType.UPDATE_CASE, updatedCase, changes);
  }

  return updatedCase;
}

// Soft delete case
export async function deleteCase(caseId: number, teamId: number, userId: number) {
  const existingCase = await getCaseById(caseId, teamId);
  if (!existingCase) return false;

  await db
    .update(cases)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(cases.id, caseId), eq(cases.teamId, teamId)));

  // Log activity
  await logCaseActivity(teamId, userId, ActivityType.DELETE_CASE, existingCase);

  return true;
}

// Assign case to user
export async function assignCase(
  caseId: number,
  teamId: number,
  assignToUserId: number | null,
  userId: number
) {
  const existingCase = await getCaseById(caseId, teamId);
  if (!existingCase) return null;

  const [updatedCase] = await db
    .update(cases)
    .set({ assignedTo: assignToUserId, updatedAt: new Date() })
    .where(and(eq(cases.id, caseId), eq(cases.teamId, teamId)))
    .returning();

  if (updatedCase) {
    // Log activity with assignment change
    const changes = detectChanges(
      existingCase as Record<string, unknown>,
      { assignedTo: assignToUserId } as Record<string, unknown>,
      ['assignedTo']
    );
    await logCaseActivity(teamId, userId, ActivityType.ASSIGN_CASE, updatedCase, changes);
  }

  return updatedCase;
}

// Get case stats for dashboard
export async function getCaseStats(teamId: number) {
  const statusCounts = await db
    .select({
      status: cases.status,
      count: sql<number>`count(*)::int`,
    })
    .from(cases)
    .where(and(eq(cases.teamId, teamId), isNull(cases.deletedAt)))
    .groupBy(cases.status);

  const typeCounts = await db
    .select({
      caseType: cases.caseType,
      count: sql<number>`count(*)::int`,
    })
    .from(cases)
    .where(and(eq(cases.teamId, teamId), isNull(cases.deletedAt)))
    .groupBy(cases.caseType);

  const [totalCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(cases)
    .where(and(eq(cases.teamId, teamId), isNull(cases.deletedAt)));

  return {
    total: totalCount?.count || 0,
    byStatus: statusCounts,
    byType: typeCounts,
  };
}

// Get cases for a client (by userId) - used for client portal
export async function getCasesForClient(userId: number) {
  // First, find the client record linked to this user
  const [clientRecord] = await db
    .select()
    .from(clients)
    .where(eq(clients.userId, userId));

  if (!clientRecord) {
    return { cases: [], client: null };
  }

  // Get all cases for this client with their forms
  const casesData = await db
    .select({
      case: cases,
      assignedUser: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(cases)
    .leftJoin(users, eq(cases.assignedTo, users.id))
    .where(and(eq(cases.clientId, clientRecord.id), isNull(cases.deletedAt)))
    .orderBy(desc(cases.createdAt));

  // For each case, get its forms with form type info
  const casesWithForms = await Promise.all(
    casesData.map(async (c) => {
      const formsData = await db
        .select({
          caseForm: caseForms,
          formType: formTypes,
        })
        .from(caseForms)
        .innerJoin(formTypes, eq(caseForms.formTypeId, formTypes.id))
        .where(eq(caseForms.caseId, c.case.id));

      const forms = formsData.map((f) => ({
        ...f.caseForm,
        formType: f.formType,
      }));

      return {
        ...c.case,
        assignedUser: c.assignedUser,
        forms,
      };
    })
  );

  return {
    cases: casesWithForms,
    client: clientRecord,
  };
}

// Get upcoming deadlines
export async function getUpcomingDeadlines(teamId: number, days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const upcomingCases = await db
    .select({
      case: cases,
      client: {
        firstName: clients.firstName,
        lastName: clients.lastName,
      },
    })
    .from(cases)
    .leftJoin(clients, eq(cases.clientId, clients.id))
    .where(
      and(
        eq(cases.teamId, teamId),
        isNull(cases.deletedAt),
        sql`${cases.filingDeadline} IS NOT NULL`,
        sql`${cases.filingDeadline} >= CURRENT_DATE`,
        sql`${cases.filingDeadline} <= ${futureDate.toISOString().split('T')[0]}`
      )
    )
    .orderBy(asc(cases.filingDeadline))
    .limit(10);

  return upcomingCases.map((c) => ({
    ...c.case,
    clientName: c.client ? `${c.client.firstName} ${c.client.lastName}` : null,
  }));
}

/**
 * Log case-related activity with entity context
 */
async function logCaseActivity(
  teamId: number,
  userId: number,
  action: ActivityType,
  caseData: Case,
  changes?: Record<string, { old: unknown; new: unknown }> | null
) {
  await logActivity({
    teamId,
    userId,
    action,
    entityType: 'case',
    entityId: caseData.id,
    entityName: caseData.caseNumber || undefined,
    changes: changes || undefined,
  });
}
