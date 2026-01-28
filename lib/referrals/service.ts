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
  type ReferralLink,
  type NewReferralLink,
  type ReferralLinkUsageRecord,
} from '@/lib/db/schema';
import { eq, and, desc, isNull, gt, or, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// ============================================
// TYPES
// ============================================

export interface CreateReferralLinkInput {
  teamId: number;
  caseId?: number;
  clientId?: number;
  expiresAt?: Date;
  maxUses?: number;
  allowedForms?: number[];
  allowedSections?: string[];
  createdBy: number;
}

export interface ReferralLinkWithDetails extends ReferralLink {
  client: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
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
  clientId: number | null;
  caseId: number | null;
  allowedForms: number[] | null;
  isValid: boolean;
  invalidReason?: string;
  client?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  case?: {
    caseNumber: string | null;
    caseType: string;
  };
  forms?: {
    id: number;
    code: string;
    name: string;
    status: string;
    progressPercentage: number;
  }[];
}

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Generate a unique referral code
 */
function generateReferralCode(): string {
  return nanoid(12); // 12 character URL-safe unique ID
}

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
      clientId: input.clientId,
      code,
      expiresAt: input.expiresAt,
      maxUses: input.maxUses ?? 1,
      currentUses: 0,
      allowedForms: input.allowedForms ? input.allowedForms : null,
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
      client: {
        id: clients.id,
        firstName: clients.firstName,
        lastName: clients.lastName,
        email: clients.email,
      },
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
    .leftJoin(clients, eq(referralLinks.clientId, clients.id))
    .leftJoin(cases, eq(referralLinks.caseId, cases.id))
    .leftJoin(users, eq(referralLinks.createdBy, users.id))
    .where(eq(referralLinks.teamId, teamId))
    .orderBy(desc(referralLinks.createdAt));

  return links.map((row) => ({
    ...row.link,
    client: row.client?.id ? row.client : null,
    case: row.case?.id ? row.case : null,
    createdByUser: row.createdByUser?.id ? row.createdByUser : null,
    usageCount: row.link.currentUses,
  }));
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
      client: {
        id: clients.id,
        firstName: clients.firstName,
        lastName: clients.lastName,
        email: clients.email,
      },
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
    .leftJoin(clients, eq(referralLinks.clientId, clients.id))
    .leftJoin(cases, eq(referralLinks.caseId, cases.id))
    .leftJoin(users, eq(referralLinks.createdBy, users.id))
    .where(and(eq(referralLinks.id, linkId), eq(referralLinks.teamId, teamId)))
    .limit(1);

  if (!links[0]) return null;

  const row = links[0];
  return {
    ...row.link,
    client: row.client?.id ? row.client : null,
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
      },
      client: {
        id: clients.id,
        firstName: clients.firstName,
        lastName: clients.lastName,
        email: clients.email,
      },
      case: {
        id: cases.id,
        caseNumber: cases.caseNumber,
        caseType: cases.caseType,
      },
    })
    .from(referralLinks)
    .innerJoin(teams, eq(referralLinks.teamId, teams.id))
    .leftJoin(clients, eq(referralLinks.clientId, clients.id))
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

  // Get forms if case exists
  let forms: ReferralLinkPublicInfo['forms'] = undefined;
  if (link.caseId) {
    const caseFormsData = await db
      .select({
        id: caseForms.id,
        code: formTypes.code,
        name: formTypes.name,
        status: caseForms.status,
        progressPercentage: caseForms.progressPercentage,
      })
      .from(caseForms)
      .innerJoin(formTypes, eq(caseForms.formTypeId, formTypes.id))
      .where(eq(caseForms.caseId, link.caseId));

    // Filter by allowed forms if specified
    const allowedFormIds = link.allowedForms as number[] | null;
    forms = caseFormsData
      .filter((f) => !allowedFormIds || allowedFormIds.includes(f.id))
      .map((f) => ({
        id: f.id,
        code: f.code,
        name: f.name,
        status: f.status,
        progressPercentage: f.progressPercentage,
      }));
  }

  return {
    id: link.id,
    code: link.code,
    teamId: link.teamId,
    teamName: row.team.name,
    clientId: link.clientId,
    caseId: link.caseId,
    allowedForms: link.allowedForms as number[] | null,
    isValid,
    invalidReason,
    client: row.client?.id
      ? {
          firstName: row.client.firstName,
          lastName: row.client.lastName,
          email: row.client.email,
        }
      : undefined,
    case: row.case?.id
      ? {
          caseNumber: row.case.caseNumber,
          caseType: row.case.caseType,
        }
      : undefined,
    forms,
  };
}

/**
 * Update a referral link
 */
export async function updateReferralLink(
  linkId: number,
  teamId: number,
  updates: Partial<Pick<ReferralLink, 'isActive' | 'expiresAt' | 'maxUses' | 'allowedForms' | 'allowedSections'>>
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
  // First delete usage records
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

  // Increment usage count if this is a registration
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
  // First verify the link belongs to the team
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

/**
 * Use a referral link to register a client
 * Links the client to the referral and increments usage
 */
export async function useReferralLinkForRegistration(
  code: string,
  userId: number,
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  }
): Promise<{
  success: boolean;
  link?: ReferralLink;
  error?: string;
}> {
  const validation = await validateReferralLink(code);

  if (!validation.valid || !validation.link) {
    return { success: false, error: validation.reason };
  }

  const link = validation.link;

  // Record usage
  await recordReferralLinkUsage(link.id, 'registered', userId, metadata);

  // If link has a client, link the user to that client
  if (link.clientId) {
    await db
      .update(clients)
      .set({ userId })
      .where(and(eq(clients.id, link.clientId), isNull(clients.userId)));
  }

  return { success: true, link };
}

// ============================================
// HELPERS
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
