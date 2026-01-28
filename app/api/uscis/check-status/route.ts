import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { teamMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
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

/**
 * POST /api/uscis/check-status
 * Check USCIS case status for a case
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's team
    const [membership] = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, user.id))
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { error: 'No team membership found' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = checkStatusSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { caseId, receiptNumber: providedReceiptNumber } = validationResult.data;

    // Verify case exists and belongs to team
    const caseData = await getCaseById(caseId, membership.teamId);
    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Use provided receipt number or get from case
    const receiptNumber = providedReceiptNumber || caseData.uscisReceiptNumber;

    if (!receiptNumber) {
      return NextResponse.json(
        { error: 'No USCIS receipt number provided or associated with this case' },
        { status: 400 }
      );
    }

    // Validate receipt number format
    if (!validateReceiptNumber(receiptNumber)) {
      return NextResponse.json(
        { error: 'Invalid receipt number format. Expected format: 3 letters + 10 digits (e.g., EAC9999103403)' },
        { status: 400 }
      );
    }

    // Check if USCIS API is configured
    if (!isUSCISApiConfigured()) {
      return NextResponse.json(
        {
          error: 'USCIS API not configured',
          message: 'Please configure USCIS_CLIENT_ID and USCIS_CLIENT_SECRET environment variables',
        },
        { status: 503 }
      );
    }

    // Check the case status
    const status = await checkCaseStatus(receiptNumber, caseId);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Error checking USCIS status:', error);
    return NextResponse.json(
      { error: 'Failed to check USCIS status' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/uscis/check-status?caseId=123
 * Get cached USCIS status for a case
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's team
    const [membership] = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, user.id))
      .limit(1);

    if (!membership) {
      return NextResponse.json(
        { error: 'No team membership found' },
        { status: 403 }
      );
    }

    // Get caseId from query params
    const { searchParams } = new URL(request.url);
    const caseIdStr = searchParams.get('caseId');

    if (!caseIdStr) {
      return NextResponse.json(
        { error: 'caseId query parameter is required' },
        { status: 400 }
      );
    }

    const caseId = parseInt(caseIdStr);
    if (isNaN(caseId)) {
      return NextResponse.json({ error: 'Invalid case ID' }, { status: 400 });
    }

    // Verify case exists and belongs to team
    const caseData = await getCaseById(caseId, membership.teamId);
    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Get cached status records for this case
    const trackedStatuses = await getTrackedCasesForCase(caseId);

    return NextResponse.json({
      success: true,
      receiptNumber: caseData.uscisReceiptNumber,
      apiConfigured: isUSCISApiConfigured(),
      data: trackedStatuses,
    });
  } catch (error) {
    console.error('Error fetching USCIS status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch USCIS status' },
      { status: 500 }
    );
  }
}
