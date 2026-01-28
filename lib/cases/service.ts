import { db } from '@/lib/db/drizzle';
import {
  cases,
  clients,
  caseForms,
  formTypes,
  users,
  activityLogs,
  ActivityType,
} from '@/lib/db/schema';
import { eq, and, desc, sql, like, or, isNull, asc } from 'drizzle-orm';

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
  await db.insert(activityLogs).values({
    teamId: input.teamId,
    userId: input.createdBy,
    action: ActivityType.CREATE_CASE,
  });

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
  const [caseData] = await db
    .select({
      case: cases,
      client: clients,
      assignedUser: users,
    })
    .from(cases)
    .leftJoin(clients, eq(cases.clientId, clients.id))
    .leftJoin(users, eq(cases.assignedTo, users.id))
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

  return {
    ...caseData.case,
    client: caseData.client,
    assignedUser: caseData.assignedUser,
    forms,
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

  // Log activity
  await db.insert(activityLogs).values({
    teamId,
    userId,
    action: ActivityType.UPDATE_CASE,
  });

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
  await db.insert(activityLogs).values({
    teamId,
    userId,
    action: ActivityType.DELETE_CASE,
  });

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

  // Log activity
  await db.insert(activityLogs).values({
    teamId,
    userId,
    action: ActivityType.ASSIGN_CASE,
  });

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
