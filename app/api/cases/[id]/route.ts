import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { teamMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  getCaseById,
  getCaseWithDetails,
  updateCase,
  deleteCase,
  assignCase,
} from '@/lib/cases/service';
import { z } from 'zod';

// Validation schema for updating a case
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

/**
 * GET /api/cases/[id]
 * Get a specific case by ID with full details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const caseId = parseInt(id);

    if (isNaN(caseId)) {
      return NextResponse.json({ error: 'Invalid case ID' }, { status: 400 });
    }

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

    // Check if we want full details
    const { searchParams } = new URL(request.url);
    const includeDetails = searchParams.get('details') === 'true';

    const caseData = includeDetails
      ? await getCaseWithDetails(caseId, membership.teamId)
      : await getCaseById(caseId, membership.teamId);

    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    return NextResponse.json(caseData);
  } catch (error) {
    console.error('Error fetching case:', error);
    return NextResponse.json(
      { error: 'Failed to fetch case' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cases/[id]
 * Update a case
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const caseId = parseInt(id);

    if (isNaN(caseId)) {
      return NextResponse.json({ error: 'Invalid case ID' }, { status: 400 });
    }

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

    // Verify case exists and belongs to team
    const existingCase = await getCaseById(caseId, membership.teamId);
    if (!existingCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateCaseSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Handle assignment separately if provided
    if (data.assignedTo !== undefined) {
      await assignCase(caseId, membership.teamId, data.assignedTo, user.id);
      delete data.assignedTo;
    }

    // Update the case with remaining fields
    const updatedCase = await updateCase(caseId, membership.teamId, user.id, data);

    return NextResponse.json(updatedCase);
  } catch (error) {
    console.error('Error updating case:', error);
    return NextResponse.json(
      { error: 'Failed to update case' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cases/[id]
 * Soft delete a case
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const caseId = parseInt(id);

    if (isNaN(caseId)) {
      return NextResponse.json({ error: 'Invalid case ID' }, { status: 400 });
    }

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

    // Verify case exists and belongs to team
    const existingCase = await getCaseById(caseId, membership.teamId);
    if (!existingCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    await deleteCase(caseId, membership.teamId, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting case:', error);
    return NextResponse.json(
      { error: 'Failed to delete case' },
      { status: 500 }
    );
  }
}
