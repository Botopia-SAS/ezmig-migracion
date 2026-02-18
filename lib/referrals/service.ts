import { db } from '@/lib/db/drizzle';
import {
  referralLinks,
  referralLinkUsage,
  clients,
  cases,
  caseForms,
  formTypes,
  users,
  teams,
  teamMembers,
  type ReferralLink,
  type ReferralLinkUsageRecord,
} from '@/lib/db/schema';
import { eq, and, desc, isNull, gt, or, sql, inArray } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// ============================================
// TYPES
// ============================================

export interface CreateReferralLinkInput {
  teamId: number;
  caseId?: number;
  formTypeIds: number[];
  expiresAt?: Date;
  maxUses?: number | null;
  allowedSections?: string[];
  createdBy: number;
}

export interface FormTypeInfo {
  id: number;
  code: string;
  name: string;
  category: string | null;
}

export interface ReferralLinkWithDetails extends ReferralLink {
  formTypes: FormTypeInfo[];
  case: {
    id: number;
    caseNumber: string | null;
    caseType: string;
  } | null;
  createdByUser: {
    id: number;
    name: string | null;
    email: string;
  } | null;
  usageCount: number;
}

export interface ReferralLinkPublicInfo {
  id: number;
  code: string;
  teamId: number;
  teamName: string;
  teamLogoUrl: string | null;
  caseId: number | null;
  formTypeIds: number[];
  createdBy: number | null;
  isValid: boolean;
  invalidReason?: string;
  formTypes: FormTypeInfo[];
  case?: {
    caseNumber: string | null;
    caseType: string;
  };
}

export interface RegistrationInput {
  email: string;
  name: string;
  passwordHash: string;
  dateOfBirth?: string;
  countryOfBirth?: string;
  nationality?: string;
  alienNumber?: string;
}

export interface RegistrationResult {
  success: boolean;
  user?: typeof users.$inferSelect;
  client?: typeof clients.$inferSelect;
  case?: typeof cases.$inferSelect;
  error?: string;
}

// ============================================
// HELPERS
// ============================================

function generateReferralCode(): string {
  return nanoid(12);
}

/**
 * Resolve form type details from an array of IDs
 */
async function fetchFormTypesByIds(ids: number[]): Promise<FormTypeInfo[]> {
  if (ids.length === 0) return [];

  const types = await db
    .select({
      id: formTypes.id,
      code: formTypes.code,
      name: formTypes.name,
      category: formTypes.category,
    })
    .from(formTypes)
    .where(inArray(formTypes.id, ids));

  return types;
}

/**
 * Infer case type from form type categories.
 * Priority: family > humanitarian > naturalization > employment > travel > other
 */
function inferCaseType(
  formTypeCategories: (string | null)[]
): 'family_based' | 'employment' | 'asylum' | 'naturalization' | 'adjustment' | 'other' {
  const categories = new Set(formTypeCategories.filter(Boolean));

  if (categories.has('family')) return 'family_based';
  if (categories.has('humanitarian')) return 'asylum';
  if (categories.has('naturalization')) return 'naturalization';
  if (categories.has('employment')) return 'employment';
  if (categories.has('travel')) return 'adjustment';
  return 'other';
}

/**
 * Generate a sequential case number: EZM-YYYY-XXXXX
 */
async function generateCaseNumber(tx: Parameters<Parameters<typeof db.transaction>[0]>[0]): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `EZM-${year}-`;

  const [latest] = await tx
    .select({ caseNumber: cases.caseNumber })
    .from(cases)
    .where(sql`${cases.caseNumber} LIKE ${prefix + '%'}`)
    .orderBy(desc(cases.caseNumber))
    .limit(1);

  let seq = 1;
  if (latest?.caseNumber) {
    const lastSeq = parseInt(latest.caseNumber.split('-').pop() || '0', 10);
    seq = lastSeq + 1;
  }

  return `${prefix}${String(seq).padStart(5, '0')}`;
}

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Create a new referral link
 */
export async function createReferralLink(
  input: CreateReferralLinkInput
): Promise<ReferralLink> {
  const code = generateReferralCode();

  const [link] = await db
    .insert(referralLinks)
    .values({
      teamId: input.teamId,
      caseId: input.caseId,
      code,
      expiresAt: input.expiresAt,
      maxUses: input.maxUses === undefined ? 1 : input.maxUses,
      currentUses: 0,
      formTypeIds: input.formTypeIds,
      allowedSections: input.allowedSections ? input.allowedSections : null,
      isActive: true,
      createdBy: input.createdBy,
    })
    .returning();

  return link;
}

/**
 * Get all referral links for a team
 */
export async function getReferralLinksByTeam(
  teamId: number
): Promise<ReferralLinkWithDetails[]> {
  const links = await db
    .select({
      link: referralLinks,
      case: {
        id: cases.id,
        caseNumber: cases.caseNumber,
        caseType: cases.caseType,
      },
      createdByUser: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(referralLinks)
    .leftJoin(cases, eq(referralLinks.caseId, cases.id))
    .leftJoin(users, eq(referralLinks.createdBy, users.id))
    .where(eq(referralLinks.teamId, teamId))
    .orderBy(desc(referralLinks.createdAt));

  // Collect all unique form type IDs to resolve in one query
  const allFormTypeIds = new Set<number>();
  for (const row of links) {
    const ids = (row.link.formTypeIds as number[]) || [];
    ids.forEach((id) => allFormTypeIds.add(id));
  }

  const allFormTypes = allFormTypeIds.size > 0
    ? await fetchFormTypesByIds([...allFormTypeIds])
    : [];
  const formTypesMap = new Map(allFormTypes.map((ft) => [ft.id, ft]));

  return links.map((row) => {
    const ids = (row.link.formTypeIds as number[]) || [];
    return {
      ...row.link,
      formTypes: ids.map((id) => formTypesMap.get(id)).filter(Boolean) as FormTypeInfo[],
      case: row.case?.id ? row.case : null,
      createdByUser: row.createdByUser?.id ? row.createdByUser : null,
      usageCount: row.link.currentUses,
    };
  });
}

/**
 * Get a referral link by ID
 */
export async function getReferralLinkById(
  linkId: number,
  teamId: number
): Promise<ReferralLinkWithDetails | null> {
  const links = await db
    .select({
      link: referralLinks,
      case: {
        id: cases.id,
        caseNumber: cases.caseNumber,
        caseType: cases.caseType,
      },
      createdByUser: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(referralLinks)
    .leftJoin(cases, eq(referralLinks.caseId, cases.id))
    .leftJoin(users, eq(referralLinks.createdBy, users.id))
    .where(and(eq(referralLinks.id, linkId), eq(referralLinks.teamId, teamId)))
    .limit(1);

  if (!links[0]) return null;

  const row = links[0];
  const ids = (row.link.formTypeIds as number[]) || [];
  const linkFormTypes = ids.length > 0 ? await fetchFormTypesByIds(ids) : [];

  return {
    ...row.link,
    formTypes: linkFormTypes,
    case: row.case?.id ? row.case : null,
    createdByUser: row.createdByUser?.id ? row.createdByUser : null,
    usageCount: row.link.currentUses,
  };
}

/**
 * Get public info for a referral link by code (for portal)
 */
export async function getReferralLinkByCode(
  code: string
): Promise<ReferralLinkPublicInfo | null> {
  const links = await db
    .select({
      link: referralLinks,
      team: {
        id: teams.id,
        name: teams.name,
        logoUrl: teams.logoUrl,
      },
      case: {
        id: cases.id,
        caseNumber: cases.caseNumber,
        caseType: cases.caseType,
      },
    })
    .from(referralLinks)
    .innerJoin(teams, eq(referralLinks.teamId, teams.id))
    .leftJoin(cases, eq(referralLinks.caseId, cases.id))
    .where(eq(referralLinks.code, code))
    .limit(1);

  if (!links[0]) return null;

  const row = links[0];
  const link = row.link;

  // Validate the link
  let isValid = true;
  let invalidReason: string | undefined;

  if (!link.isActive) {
    isValid = false;
    invalidReason = 'This link has been deactivated';
  } else if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    isValid = false;
    invalidReason = 'This link has expired';
  } else if (link.maxUses && link.currentUses >= link.maxUses) {
    isValid = false;
    invalidReason = 'This link has reached its maximum usage limit';
  }

  const ids = (link.formTypeIds as number[]) || [];
  const linkFormTypes = ids.length > 0 ? await fetchFormTypesByIds(ids) : [];

  return {
    id: link.id,
    code: link.code,
    teamId: link.teamId,
    teamName: row.team.name,
    teamLogoUrl: row.team.logoUrl,
    caseId: link.caseId,
    formTypeIds: ids,
    createdBy: link.createdBy,
    isValid,
    invalidReason,
    formTypes: linkFormTypes,
    case: row.case?.id
      ? {
          caseNumber: row.case.caseNumber,
          caseType: row.case.caseType,
        }
      : undefined,
  };
}

/**
 * Update a referral link
 */
export async function updateReferralLink(
  linkId: number,
  teamId: number,
  updates: Partial<Pick<ReferralLink, 'isActive' | 'expiresAt' | 'maxUses' | 'formTypeIds' | 'allowedSections'>>
): Promise<ReferralLink | null> {
  const [updated] = await db
    .update(referralLinks)
    .set(updates)
    .where(and(eq(referralLinks.id, linkId), eq(referralLinks.teamId, teamId)))
    .returning();

  return updated || null;
}

/**
 * Deactivate a referral link
 */
export async function deactivateReferralLink(
  linkId: number,
  teamId: number
): Promise<boolean> {
  const [updated] = await db
    .update(referralLinks)
    .set({ isActive: false })
    .where(and(eq(referralLinks.id, linkId), eq(referralLinks.teamId, teamId)))
    .returning();

  return !!updated;
}

/**
 * Delete a referral link
 */
export async function deleteReferralLink(
  linkId: number,
  teamId: number
): Promise<boolean> {
  await db
    .delete(referralLinkUsage)
    .where(eq(referralLinkUsage.referralLinkId, linkId));

  const [deleted] = await db
    .delete(referralLinks)
    .where(and(eq(referralLinks.id, linkId), eq(referralLinks.teamId, teamId)))
    .returning();

  return !!deleted;
}

// ============================================
// USAGE TRACKING
// ============================================

/**
 * Record usage of a referral link
 */
export async function recordReferralLinkUsage(
  linkId: number,
  action: 'visited' | 'registered' | 'form_started' | 'form_completed',
  userId?: number,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    [key: string]: unknown;
  }
): Promise<ReferralLinkUsageRecord> {
  const [usage] = await db
    .insert(referralLinkUsage)
    .values({
      referralLinkId: linkId,
      userId,
      action,
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
      metadata: metadata ? { ...metadata, ipAddress: undefined, userAgent: undefined } : null,
    })
    .returning();

  if (action === 'registered') {
    await db
      .update(referralLinks)
      .set({
        currentUses: sql`${referralLinks.currentUses} + 1`,
      })
      .where(eq(referralLinks.id, linkId));
  }

  return usage;
}

/**
 * Get usage history for a referral link
 */
export async function getReferralLinkUsage(
  linkId: number,
  teamId: number
): Promise<(ReferralLinkUsageRecord & { user: { email: string } | null })[]> {
  const [link] = await db
    .select({ id: referralLinks.id })
    .from(referralLinks)
    .where(and(eq(referralLinks.id, linkId), eq(referralLinks.teamId, teamId)))
    .limit(1);

  if (!link) return [];

  const usages = await db
    .select({
      usage: referralLinkUsage,
      user: {
        email: users.email,
      },
    })
    .from(referralLinkUsage)
    .leftJoin(users, eq(referralLinkUsage.userId, users.id))
    .where(eq(referralLinkUsage.referralLinkId, linkId))
    .orderBy(desc(referralLinkUsage.createdAt));

  return usages.map((row) => ({
    ...row.usage,
    user: row.user?.email ? row.user : null,
  }));
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate if a referral link can be used
 */
export async function validateReferralLink(code: string): Promise<{
  valid: boolean;
  link?: ReferralLink;
  reason?: string;
}> {
  const [link] = await db
    .select()
    .from(referralLinks)
    .where(eq(referralLinks.code, code))
    .limit(1);

  if (!link) {
    return { valid: false, reason: 'Link not found' };
  }

  if (!link.isActive) {
    return { valid: false, link, reason: 'Link is deactivated' };
  }

  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    return { valid: false, link, reason: 'Link has expired' };
  }

  if (link.maxUses && link.currentUses >= link.maxUses) {
    return { valid: false, link, reason: 'Link has reached maximum uses' };
  }

  return { valid: true, link };
}

// ============================================
// REGISTRATION VIA REFERRAL LINK
// ============================================

/**
 * Use a referral link to register a new user + client + case.
 * All operations run inside a single transaction.
 *
 * Logic:
 * 1. Validate link (active, not expired, uses available)
 * 2. Verify email doesn't exist
 * 3. Create user (role: end_user)
 * 4. Create client (with immigration data)
 * 5. Add teamMembers (userId, teamId, role: client)
 * 6. If link has NO caseId:
 *    - Infer caseType from formType categories
 *    - Generate caseNumber (EZM-YYYY-XXXXX)
 *    - Create case (teamId, clientId, status: intake)
 *    - Create case_forms for each formTypeId
 * 7. If link HAS caseId:
 *    - Update case.clientId = new client
 *    - Create missing case_forms
 * 8. Record usage
 * 9. Increment currentUses
 */
export async function useReferralLinkForRegistration(
  code: string,
  registrationData: RegistrationInput,
  metadata?: { ipAddress?: string; userAgent?: string }
): Promise<RegistrationResult> {
  // 1. Validate link outside transaction (read-only)
  const validation = await validateReferralLink(code);
  if (!validation.valid || !validation.link) {
    return { success: false, error: validation.reason };
  }

  const link = validation.link;
  const formTypeIds = (link.formTypeIds as number[]) || [];

  // 2. Check email not taken
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, registrationData.email))
    .limit(1);

  if (existingUser) {
    return { success: false, error: 'Email already registered' };
  }

  // Resolve form types for category inference
  const linkFormTypes = formTypeIds.length > 0 ? await fetchFormTypesByIds(formTypeIds) : [];

  // Parse name into first/last
  const nameParts = registrationData.name.trim().split(/\s+/);
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';

  // 3-9. Run everything in a transaction
  return await db.transaction(async (tx) => {
    // 3. Create user
    const [newUser] = await tx
      .insert(users)
      .values({
        name: registrationData.name,
        email: registrationData.email,
        passwordHash: registrationData.passwordHash,
        role: 'end_user',
      })
      .returning();

    // 4. Create client
    const [newClient] = await tx
      .insert(clients)
      .values({
        teamId: link.teamId,
        userId: newUser.id,
        firstName,
        lastName,
        email: registrationData.email,
        dateOfBirth: registrationData.dateOfBirth || null,
        countryOfBirth: registrationData.countryOfBirth || null,
        nationality: registrationData.nationality || null,
        alienNumber: registrationData.alienNumber || null,
      })
      .returning();

    // 5. Add team membership
    await tx.insert(teamMembers).values({
      userId: newUser.id,
      teamId: link.teamId,
      role: 'client',
    });

    let caseRecord: typeof cases.$inferSelect;

    if (!link.caseId) {
      // 6. No existing case — create one
      const caseType = inferCaseType(linkFormTypes.map((ft) => ft.category));
      const caseNumber = await generateCaseNumber(tx);

      const [newCase] = await tx
        .insert(cases)
        .values({
          teamId: link.teamId,
          clientId: newClient.id,
          caseNumber,
          caseType,
          status: 'intake',
          priority: 'normal',
          createdBy: link.createdBy,
        })
        .returning();

      caseRecord = newCase;

      // Create case_forms for each formTypeId
      if (formTypeIds.length > 0) {
        await tx.insert(caseForms).values(
          formTypeIds.map((ftId) => ({
            caseId: newCase.id,
            formTypeId: ftId,
            status: 'not_started' as const,
            progressPercentage: 0,
          }))
        );

        // Pre-fill I-130 beneficiary data from registration
        const i130FormType = linkFormTypes.find((ft) => ft.code === 'I-130');
        if (i130FormType) {
          const prefillData = {
            part4: {
              names: {
                familyName: lastName || '',
                givenName: firstName || '',
              },
              birthInfo: {
                dateOfBirth: registrationData.dateOfBirth || '',
                countryOfBirth: registrationData.countryOfBirth || '',
              },
              citizenship: {
                nationality: registrationData.nationality || '',
              },
              identifiers: {
                alienNumber: registrationData.alienNumber || '',
              },
            },
          };

          await tx
            .update(caseForms)
            .set({ formData: prefillData })
            .where(
              and(
                eq(caseForms.caseId, newCase.id),
                eq(caseForms.formTypeId, i130FormType.id)
              )
            );
        }
      }
    } else {
      // 7. Existing case — update its clientId and add missing forms
      const [updatedCase] = await tx
        .update(cases)
        .set({ clientId: newClient.id })
        .where(eq(cases.id, link.caseId))
        .returning();

      caseRecord = updatedCase;

      // Get existing case_forms to avoid duplicates
      const existingForms = await tx
        .select({ formTypeId: caseForms.formTypeId })
        .from(caseForms)
        .where(eq(caseForms.caseId, link.caseId));

      const existingFormTypeIds = new Set(existingForms.map((f) => f.formTypeId));
      const missingFormTypeIds = formTypeIds.filter((id) => !existingFormTypeIds.has(id));

      if (missingFormTypeIds.length > 0) {
        await tx.insert(caseForms).values(
          missingFormTypeIds.map((ftId) => ({
            caseId: link.caseId!,
            formTypeId: ftId,
            status: 'not_started' as const,
            progressPercentage: 0,
          }))
        );
      }
    }

    // 8. Record usage
    await tx.insert(referralLinkUsage).values({
      referralLinkId: link.id,
      userId: newUser.id,
      action: 'registered',
      ipAddress: metadata?.ipAddress,
      userAgent: metadata?.userAgent,
    });

    // 9. Increment currentUses
    await tx
      .update(referralLinks)
      .set({
        currentUses: sql`${referralLinks.currentUses} + 1`,
      })
      .where(eq(referralLinks.id, link.id));

    return {
      success: true,
      user: newUser,
      client: newClient,
      case: caseRecord,
    };
  });
}

// ============================================
// HELPERS (PUBLIC)
// ============================================

/**
 * Generate the full URL for a referral link
 */
export function getReferralLinkUrl(code: string, baseUrl: string): string {
  return `${baseUrl}/portal/${code}`;
}

/**
 * Get active referral links count for a team
 */
export async function getActiveReferralLinksCount(teamId: number): Promise<number> {
  const now = new Date();

  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(referralLinks)
    .where(
      and(
        eq(referralLinks.teamId, teamId),
        eq(referralLinks.isActive, true),
        or(
          isNull(referralLinks.expiresAt),
          gt(referralLinks.expiresAt, now)
        )
      )
    );

  return result[0]?.count ?? 0;
}

/**
 * Create one default referral link per active form type for a team.
 * Each link allows unlimited uses and never expires.
 * Idempotent: skips form types that already have a referral link.
 */
export async function createDefaultReferralLinks(
  teamId: number,
  createdBy: number
): Promise<ReferralLink[]> {
  // Get all active form types
  const activeFormTypes = await db
    .select({ id: formTypes.id })
    .from(formTypes)
    .where(eq(formTypes.isActive, true));

  if (activeFormTypes.length === 0) return [];

  // Get existing referral links for this team to avoid duplicates
  const existingLinks = await db
    .select({ formTypeIds: referralLinks.formTypeIds })
    .from(referralLinks)
    .where(eq(referralLinks.teamId, teamId));

  // Collect form type IDs that already have a dedicated link
  const coveredFormTypeIds = new Set<number>();
  for (const link of existingLinks) {
    if (Array.isArray(link.formTypeIds) && link.formTypeIds.length === 1) {
      coveredFormTypeIds.add(link.formTypeIds[0]);
    }
  }

  const created: ReferralLink[] = [];

  for (const ft of activeFormTypes) {
    if (coveredFormTypeIds.has(ft.id)) continue;

    const link = await createReferralLink({
      teamId,
      formTypeIds: [ft.id],
      maxUses: null,
      createdBy,
    });
    created.push(link);
  }

  return created;
}
