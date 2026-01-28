import { db } from '@/lib/db/drizzle';
import { uscisCaseStatus } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// USCIS API Configuration
const USCIS_API_BASE = process.env.USCIS_API_URL || 'https://api-int.uscis.gov';
const USCIS_TOKEN_URL = `${USCIS_API_BASE}/oauth/accesstoken`;
const USCIS_CASE_STATUS_URL = `${USCIS_API_BASE}/case-status`;

// Token cache
let cachedToken: { token: string; expiresAt: number } | null = null;

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
 * Get OAuth 2.0 access token from USCIS
 * Uses Client Credentials flow
 */
async function getAccessToken(): Promise<string | null> {
  const clientId = process.env.USCIS_CLIENT_ID;
  const clientSecret = process.env.USCIS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return null;
  }

  // Check if we have a valid cached token
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.token;
  }

  try {
    const response = await fetch(USCIS_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      console.error('USCIS OAuth error:', response.status, await response.text());
      return null;
    }

    const data = await response.json();

    // Cache the token (subtract 60 seconds for safety margin)
    cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };

    return data.access_token;
  } catch (error) {
    console.error('USCIS OAuth exception:', error);
    return null;
  }
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
  // Check if cache is valid AND not corrupted (contains [object Object])
  const isCacheCorrupted = (cached?.currentStatus && cached.currentStatus.includes('[object')) ||
    (cached?.statusDescription && cached.statusDescription.includes('[object'));

  if (cached && cached.lastCheckedAt && isRecentEnough(cached.lastCheckedAt, 60) && !isCacheCorrupted) {
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
 * Fetch status from USCIS API
 * Requires USCIS_CLIENT_ID and USCIS_CLIENT_SECRET env vars
 */
async function fetchFromUSCIS(receiptNumber: string): Promise<Omit<CaseStatusResult, 'source' | 'receiptNumber'>> {
  const token = await getAccessToken();

  // If no credentials configured, return placeholder
  if (!token) {
    console.log('USCIS API not configured. Set USCIS_CLIENT_ID and USCIS_CLIENT_SECRET.');
    return {
      status: 'PENDING_API_SETUP',
      statusDescription: 'USCIS API integration pending. Configure USCIS_CLIENT_ID and USCIS_CLIENT_SECRET.',
      lastCheckedAt: new Date(),
    };
  }

  try {
    const response = await fetch(`${USCIS_CASE_STATUS_URL}/${receiptNumber}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('USCIS API error:', response.status, errorText);

      if (response.status === 404) {
        return {
          status: 'NOT_FOUND',
          statusDescription: 'Receipt number not found in USCIS system.',
          lastCheckedAt: new Date(),
        };
      }

      return {
        status: 'API_ERROR',
        statusDescription: `USCIS API error: ${response.status}`,
        lastCheckedAt: new Date(),
      };
    }

    const data = await response.json();

    console.log('USCIS API raw response:', JSON.stringify(data, null, 2));

    // Map USCIS API response to our format
    let statusValue = 'Unknown';
    let descriptionValue = '';

    // USCIS API returns data in case_status object
    if (data.case_status) {
      const cs = data.case_status;
      // Use the English status text fields
      statusValue = cs.current_case_status_text_en || cs.case_status || 'Unknown';
      descriptionValue = cs.current_case_status_desc_en || cs.case_status_desc || '';
    } else if (typeof data.status === 'object' && data.status !== null) {
      // Fallback for other API response formats
      statusValue = data.status.code || data.status.name || data.status.value || JSON.stringify(data.status);
      descriptionValue = data.status.description || data.status.message || '';
    } else if (typeof data.status === 'string') {
      statusValue = data.status;
      descriptionValue = data.description || data.message || '';
    }

    // Truncate description to fit database column (varchar 255)
    if (descriptionValue.length > 250) {
      descriptionValue = descriptionValue.substring(0, 247) + '...';
    }

    return {
      status: statusValue,
      statusDescription: descriptionValue,
      lastCheckedAt: new Date(),
    };
  } catch (error) {
    console.error('USCIS API exception:', error);
    return {
      status: 'API_ERROR',
      statusDescription: error instanceof Error ? error.message : 'Unknown error',
      lastCheckedAt: new Date(),
    };
  }
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

/**
 * Check if USCIS API is configured
 */
export function isUSCISApiConfigured(): boolean {
  return !!(process.env.USCIS_CLIENT_ID && process.env.USCIS_CLIENT_SECRET);
}

/**
 * Clear cached OAuth token (useful for testing or when credentials change)
 */
export function clearTokenCache(): void {
  cachedToken = null;
}
