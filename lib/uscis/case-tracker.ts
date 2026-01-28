import { db } from '@/lib/db/drizzle';
import { uscisCaseStatus } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export interface CaseStatusResult {
  receiptNumber: string;
  status: string;
  statusDescription: string;
  lastCheckedAt: Date | null;
  source: 'api' | 'cache';
}

export interface CaseStatusHistory {
  status: string;
  description: string;
  date: Date;
}

/**
 * USCIS Receipt Number format: XXX-YYY-ZZZZZ
 * Example: EAC2390012345
 */
export function validateReceiptNumber(receiptNumber: string): boolean {
  // Remove any dashes or spaces
  const cleaned = receiptNumber.replace(/[-\s]/g, '').toUpperCase();

  // USCIS receipt numbers are 13 characters: 3 letters + 10 digits
  const pattern = /^[A-Z]{3}\d{10}$/;
  return pattern.test(cleaned);
}

/**
 * Format receipt number for display
 */
export function formatReceiptNumber(receiptNumber: string): string {
  const cleaned = receiptNumber.replace(/[-\s]/g, '').toUpperCase();
  // Format as XXX-YYY-ZZZZZ
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
}

/**
 * Check case status via USCIS
 * Note: Official USCIS API requires registration at developer.uscis.gov
 * This implementation provides a stub for when API access is available
 */
export async function checkCaseStatus(
  receiptNumber: string,
  caseId: number
): Promise<CaseStatusResult> {
  if (!validateReceiptNumber(receiptNumber)) {
    throw new Error('Invalid receipt number format');
  }

  const cleanedReceipt = receiptNumber.replace(/[-\s]/g, '').toUpperCase();

  // First, check if we have a recent cached result (within 1 hour)
  const cached = await getCachedStatus(cleanedReceipt);
  if (cached && cached.lastCheckedAt && isRecentEnough(cached.lastCheckedAt, 60)) {
    return {
      receiptNumber: formatReceiptNumber(cleanedReceipt),
      status: cached.currentStatus || 'Unknown',
      statusDescription: cached.statusDescription || '',
      lastCheckedAt: cached.lastCheckedAt,
      source: 'cache',
    };
  }

  // In production, this would call the USCIS API
  // For now, we'll return a placeholder that indicates API setup is needed
  const result = await fetchFromUSCIS(cleanedReceipt);

  // Store the result
  await storeCaseStatus(caseId, cleanedReceipt, result);

  return {
    ...result,
    receiptNumber: formatReceiptNumber(cleanedReceipt),
    source: 'api',
  };
}

/**
 * Fetch status from USCIS (placeholder for real API integration)
 */
async function fetchFromUSCIS(receiptNumber: string): Promise<Omit<CaseStatusResult, 'source' | 'receiptNumber'>> {
  // TODO: Implement actual USCIS API call
  // Register at https://developer.uscis.gov to get API access

  // This is a placeholder response
  // In production, replace with actual API call:
  /*
  const response = await fetch(`https://api.uscis.gov/case-status/${receiptNumber}`, {
    headers: {
      'Authorization': `Bearer ${process.env.USCIS_API_KEY}`,
    },
  });
  const data = await response.json();
  */

  return {
    status: 'PENDING_API_SETUP',
    statusDescription: 'USCIS API integration pending. Register at developer.uscis.gov for API access.',
    lastCheckedAt: new Date(),
  };
}

/**
 * Get cached status from database
 */
async function getCachedStatus(receiptNumber: string) {
  const [result] = await db
    .select()
    .from(uscisCaseStatus)
    .where(eq(uscisCaseStatus.receiptNumber, receiptNumber))
    .orderBy(desc(uscisCaseStatus.lastCheckedAt))
    .limit(1);

  return result;
}

/**
 * Store case status in database
 */
async function storeCaseStatus(
  caseId: number,
  receiptNumber: string,
  result: Omit<CaseStatusResult, 'source' | 'receiptNumber'>
) {
  // Check if record exists
  const existing = await getCachedStatus(receiptNumber);

  if (existing) {
    // Update existing record
    await db
      .update(uscisCaseStatus)
      .set({
        currentStatus: result.status,
        statusDescription: result.statusDescription,
        lastCheckedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(uscisCaseStatus.id, existing.id));
  } else {
    // Insert new record
    await db.insert(uscisCaseStatus).values({
      caseId,
      receiptNumber,
      currentStatus: result.status,
      statusDescription: result.statusDescription,
      lastCheckedAt: new Date(),
    });
  }
}

/**
 * Get case status history from statusHistory JSON field
 */
export async function getCaseStatusHistory(
  receiptNumber: string
): Promise<CaseStatusHistory[]> {
  const cleanedReceipt = receiptNumber.replace(/[-\s]/g, '').toUpperCase();

  const [result] = await db
    .select()
    .from(uscisCaseStatus)
    .where(eq(uscisCaseStatus.receiptNumber, cleanedReceipt))
    .limit(1);

  if (!result || !result.statusHistory) {
    return [];
  }

  // Parse statusHistory JSON
  const history = result.statusHistory as Array<{
    status: string;
    description?: string;
    date: string;
  }>;

  return history.map((h) => ({
    status: h.status,
    description: h.description || '',
    date: new Date(h.date),
  }));
}

/**
 * Get all tracked cases for a specific case
 */
export async function getTrackedCasesForCase(caseId: number) {
  return db
    .select()
    .from(uscisCaseStatus)
    .where(eq(uscisCaseStatus.caseId, caseId))
    .orderBy(desc(uscisCaseStatus.lastCheckedAt));
}

/**
 * Check if a cached result is recent enough
 */
function isRecentEnough(date: Date, maxAgeMinutes: number): boolean {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = diffMs / (1000 * 60);
  return diffMinutes < maxAgeMinutes;
}

/**
 * Common USCIS case statuses
 */
export const USCIS_STATUSES = {
  CASE_RECEIVED: 'Case Was Received',
  INITIAL_REVIEW: 'Case Is Being Actively Reviewed',
  FINGERPRINT_SCHEDULED: 'Fingerprint Appointment Was Scheduled',
  FINGERPRINT_TAKEN: 'Fingerprints Were Taken',
  RFE_SENT: 'Request for Evidence Was Sent',
  RFE_RECEIVED: 'Response To Request For Evidence Was Received',
  INTERVIEW_SCHEDULED: 'Interview Was Scheduled',
  INTERVIEW_COMPLETED: 'Interview Was Completed',
  CASE_APPROVED: 'Case Was Approved',
  CARD_PRODUCED: 'New Card Is Being Produced',
  CARD_MAILED: 'Card Was Mailed To Me',
  CARD_DELIVERED: 'Card Was Delivered',
  CASE_DENIED: 'Case Was Denied',
  CASE_TRANSFERRED: 'Case Was Transferred',
} as const;

export type USCISStatus = keyof typeof USCIS_STATUSES;
