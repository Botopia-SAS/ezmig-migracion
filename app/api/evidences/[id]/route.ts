import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { teamMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getEvidenceById, updateEvidence, deleteEvidence, validateEvidence } from '@/lib/evidences/service';
import { z } from 'zod';

const updateEvidenceSchema = z.object({
  category: z.string().optional(),
  subcategory: z.string().optional(),
  documentDate: z.string().nullable().optional(),
  validationStatus: z.enum(['pending', 'valid', 'invalid', 'needs_review']).optional(),
  validationNotes: z.string().nullable().optional(),
});

const validateEvidenceSchema = z.object({
  status: z.enum(['valid', 'invalid', 'needs_review']),
  notes: z.string().optional(),
});

/**
 * GET /api/evidences/[id]
 * Get a specific evidence
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const evidenceId = parseInt(id);

    if (isNaN(evidenceId)) {
      return NextResponse.json({ error: 'Invalid evidence ID' }, { status: 400 });
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
      return NextResponse.json({ error: 'No team membership found' }, { status: 403 });
    }

    const evidence = await getEvidenceById(evidenceId, membership.teamId);

    if (!evidence) {
      return NextResponse.json({ error: 'Evidence not found' }, { status: 404 });
    }

    return NextResponse.json(evidence);
  } catch (error) {
    console.error('Error fetching evidence:', error);
    return NextResponse.json({ error: 'Failed to fetch evidence' }, { status: 500 });
  }
}

/**
 * PUT /api/evidences/[id]
 * Update evidence metadata
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const evidenceId = parseInt(id);

    if (isNaN(evidenceId)) {
      return NextResponse.json({ error: 'Invalid evidence ID' }, { status: 400 });
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
      return NextResponse.json({ error: 'No team membership found' }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = updateEvidenceSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const updatedEvidence = await updateEvidence(
      evidenceId,
      membership.teamId,
      user.id,
      validationResult.data
    );

    return NextResponse.json(updatedEvidence);
  } catch (error) {
    console.error('Error updating evidence:', error);
    const message = error instanceof Error ? error.message : 'Failed to update evidence';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/evidences/[id]
 * Soft delete an evidence
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const evidenceId = parseInt(id);

    if (isNaN(evidenceId)) {
      return NextResponse.json({ error: 'Invalid evidence ID' }, { status: 400 });
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
      return NextResponse.json({ error: 'No team membership found' }, { status: 403 });
    }

    await deleteEvidence(evidenceId, membership.teamId, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting evidence:', error);
    const message = error instanceof Error ? error.message : 'Failed to delete evidence';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
