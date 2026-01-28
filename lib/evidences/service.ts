import { db } from '@/lib/db/drizzle';
import {
  evidences,
  evidenceRules,
  cases,
  users,
  activityLogs,
  ActivityType,
  type Evidence,
  type NewEvidence,
} from '@/lib/db/schema';
import { eq, and, desc, isNull, sql } from 'drizzle-orm';

// Types
export interface CreateEvidenceInput {
  caseId: number;
  caseFormId?: number;
  fileName: string;
  fileType?: string;
  fileSize?: number;
  fileUrl: string;
  category?: string;
  subcategory?: string;
  documentDate?: string;
}

export interface UpdateEvidenceInput {
  category?: string;
  subcategory?: string;
  documentDate?: string | null;
  validationStatus?: 'pending' | 'valid' | 'invalid' | 'needs_review';
  validationNotes?: string | null;
}

export interface EvidenceFilters {
  caseFormId?: number;
  category?: string;
  validationStatus?: string;
  limit?: number;
  offset?: number;
}

// Get evidence by ID
export async function getEvidenceById(evidenceId: number, teamId: number) {
  const [result] = await db
    .select({
      evidence: evidences,
      uploadedByUser: users,
    })
    .from(evidences)
    .innerJoin(cases, eq(evidences.caseId, cases.id))
    .leftJoin(users, eq(evidences.uploadedBy, users.id))
    .where(
      and(
        eq(evidences.id, evidenceId),
        eq(cases.teamId, teamId),
        isNull(evidences.deletedAt)
      )
    );

  if (!result) return null;

  return {
    ...result.evidence,
    uploadedByUser: result.uploadedByUser,
  };
}

// Get evidences for a case
export async function getEvidencesForCase(
  caseId: number,
  teamId: number,
  filters: EvidenceFilters = {}
) {
  const { caseFormId, category, validationStatus, limit = 100, offset = 0 } = filters;

  // Verify case belongs to team
  const [caseData] = await db
    .select()
    .from(cases)
    .where(and(eq(cases.id, caseId), eq(cases.teamId, teamId), isNull(cases.deletedAt)));

  if (!caseData) return { evidences: [], total: 0 };

  const conditions = [eq(evidences.caseId, caseId), isNull(evidences.deletedAt)];

  if (caseFormId) {
    conditions.push(eq(evidences.caseFormId, caseFormId));
  }
  if (category) {
    conditions.push(eq(evidences.category, category));
  }
  if (validationStatus) {
    conditions.push(eq(evidences.validationStatus, validationStatus as any));
  }

  const evidenceList = await db
    .select({
      evidence: evidences,
      uploadedByUser: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(evidences)
    .leftJoin(users, eq(evidences.uploadedBy, users.id))
    .where(and(...conditions))
    .orderBy(desc(evidences.uploadedAt))
    .limit(limit)
    .offset(offset);

  // Get total count
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(evidences)
    .where(and(...conditions));

  return {
    evidences: evidenceList.map((e) => ({
      ...e.evidence,
      uploadedByUser: e.uploadedByUser,
    })),
    total: Number(countResult?.count || 0),
    limit,
    offset,
  };
}

// Create evidence
export async function createEvidence(
  input: CreateEvidenceInput,
  teamId: number,
  userId: number
): Promise<Evidence> {
  // Verify case belongs to team
  const [caseData] = await db
    .select()
    .from(cases)
    .where(and(eq(cases.id, input.caseId), eq(cases.teamId, teamId), isNull(cases.deletedAt)));

  if (!caseData) {
    throw new Error('Case not found');
  }

  const [newEvidence] = await db
    .insert(evidences)
    .values({
      caseId: input.caseId,
      caseFormId: input.caseFormId || null,
      fileName: input.fileName,
      fileType: input.fileType,
      fileSize: input.fileSize,
      fileUrl: input.fileUrl,
      category: input.category,
      subcategory: input.subcategory,
      documentDate: input.documentDate || null,
      uploadedBy: userId,
    })
    .returning();

  // Log activity
  await db.insert(activityLogs).values({
    teamId,
    userId,
    action: ActivityType.UPLOAD_EVIDENCE,
  });

  return newEvidence;
}

// Update evidence
export async function updateEvidence(
  evidenceId: number,
  teamId: number,
  userId: number,
  data: UpdateEvidenceInput
) {
  const existingEvidence = await getEvidenceById(evidenceId, teamId);
  if (!existingEvidence) {
    throw new Error('Evidence not found');
  }

  const updateData: Record<string, unknown> = {};

  if (data.category !== undefined) updateData.category = data.category;
  if (data.subcategory !== undefined) updateData.subcategory = data.subcategory;
  if (data.documentDate !== undefined) updateData.documentDate = data.documentDate;
  if (data.validationStatus !== undefined) {
    updateData.validationStatus = data.validationStatus;
    if (data.validationStatus !== 'pending') {
      updateData.validatedBy = userId;
      updateData.validatedAt = new Date();
    }
  }
  if (data.validationNotes !== undefined) updateData.validationNotes = data.validationNotes;

  const [updatedEvidence] = await db
    .update(evidences)
    .set(updateData)
    .where(eq(evidences.id, evidenceId))
    .returning();

  return updatedEvidence;
}

// Validate evidence
export async function validateEvidence(
  evidenceId: number,
  teamId: number,
  userId: number,
  status: 'valid' | 'invalid' | 'needs_review',
  notes?: string
) {
  const existingEvidence = await getEvidenceById(evidenceId, teamId);
  if (!existingEvidence) {
    throw new Error('Evidence not found');
  }

  const [updatedEvidence] = await db
    .update(evidences)
    .set({
      validationStatus: status,
      validationNotes: notes || null,
      validatedBy: userId,
      validatedAt: new Date(),
    })
    .where(eq(evidences.id, evidenceId))
    .returning();

  // Log activity
  await db.insert(activityLogs).values({
    teamId,
    userId,
    action: ActivityType.VALIDATE_EVIDENCE,
  });

  return updatedEvidence;
}

// Delete evidence (soft delete)
export async function deleteEvidence(evidenceId: number, teamId: number, userId: number) {
  const existingEvidence = await getEvidenceById(evidenceId, teamId);
  if (!existingEvidence) {
    throw new Error('Evidence not found');
  }

  await db
    .update(evidences)
    .set({ deletedAt: new Date() })
    .where(eq(evidences.id, evidenceId));

  // Log activity
  await db.insert(activityLogs).values({
    teamId,
    userId,
    action: ActivityType.DELETE_EVIDENCE,
  });

  return { success: true };
}

// Get evidence rules for a form type
export async function getEvidenceRules(formTypeId?: number, caseType?: string) {
  const conditions = [];

  if (formTypeId) {
    conditions.push(eq(evidenceRules.formTypeId, formTypeId));
  }
  if (caseType) {
    conditions.push(eq(evidenceRules.caseType, caseType as any));
  }

  const rules = await db
    .select()
    .from(evidenceRules)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(evidenceRules.category);

  return rules;
}

// Get evidence categories (distinct)
export async function getEvidenceCategories() {
  const categories = await db
    .selectDistinct({ category: evidences.category })
    .from(evidences)
    .where(isNull(evidences.deletedAt));

  return categories.map((c) => c.category).filter(Boolean);
}

// Get evidence stats for a case
export async function getEvidenceStats(caseId: number, teamId: number) {
  // Verify case belongs to team
  const [caseData] = await db
    .select()
    .from(cases)
    .where(and(eq(cases.id, caseId), eq(cases.teamId, teamId), isNull(cases.deletedAt)));

  if (!caseData) return null;

  const stats = await db
    .select({
      validationStatus: evidences.validationStatus,
      count: sql<number>`count(*)::int`,
    })
    .from(evidences)
    .where(and(eq(evidences.caseId, caseId), isNull(evidences.deletedAt)))
    .groupBy(evidences.validationStatus);

  const byCategory = await db
    .select({
      category: evidences.category,
      count: sql<number>`count(*)::int`,
    })
    .from(evidences)
    .where(and(eq(evidences.caseId, caseId), isNull(evidences.deletedAt)))
    .groupBy(evidences.category);

  const total = stats.reduce((sum, s) => sum + s.count, 0);
  const validated = stats.find((s) => s.validationStatus === 'valid')?.count || 0;
  const pending = stats.find((s) => s.validationStatus === 'pending')?.count || 0;
  const invalid = stats.find((s) => s.validationStatus === 'invalid')?.count || 0;
  const needsReview = stats.find((s) => s.validationStatus === 'needs_review')?.count || 0;

  return {
    total,
    validated,
    pending,
    invalid,
    needsReview,
    byStatus: stats,
    byCategory,
  };
}
