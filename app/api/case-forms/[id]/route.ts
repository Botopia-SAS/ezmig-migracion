import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { teamMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  getCaseFormById,
  updateCaseForm,
  deleteCaseForm,
  getAutosavedFields,
} from '@/lib/forms/service';
import { z } from 'zod';

const updateCaseFormSchema = z.object({
  formData: z.record(z.unknown()).optional(),
  status: z
    .enum(['not_started', 'in_progress', 'completed', 'submitted'])
    .optional(),
  progressPercentage: z.number().int().min(0).max(100).optional(),
});

/**
 * GET /api/case-forms/[id]
 * Get a specific case form with its data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const caseFormId = parseInt(id);

    if (isNaN(caseFormId)) {
      return NextResponse.json(
        { error: 'Invalid case form ID' },
        { status: 400 }
      );
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

    const caseForm = await getCaseFormById(caseFormId, membership.teamId);

    if (!caseForm) {
      return NextResponse.json(
        { error: 'Case form not found' },
        { status: 404 }
      );
    }

    // Get autosaved fields
    const autosavedFields = await getAutosavedFields(caseFormId);

    return NextResponse.json({
      ...caseForm,
      autosavedFields,
    });
  } catch (error) {
    console.error('Error fetching case form:', error);
    return NextResponse.json(
      { error: 'Failed to fetch case form' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/case-forms/[id]
 * Update case form data
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const caseFormId = parseInt(id);

    if (isNaN(caseFormId)) {
      return NextResponse.json(
        { error: 'Invalid case form ID' },
        { status: 400 }
      );
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

    const body = await request.json();
    const validationResult = updateCaseFormSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const updatedForm = await updateCaseForm(
      caseFormId,
      membership.teamId,
      user.id,
      validationResult.data
    );

    return NextResponse.json(updatedForm);
  } catch (error) {
    console.error('Error updating case form:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to update case form';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/case-forms/[id]
 * Delete a case form
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const caseFormId = parseInt(id);

    if (isNaN(caseFormId)) {
      return NextResponse.json(
        { error: 'Invalid case form ID' },
        { status: 400 }
      );
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

    await deleteCaseForm(caseFormId, membership.teamId, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting case form:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to delete case form';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
