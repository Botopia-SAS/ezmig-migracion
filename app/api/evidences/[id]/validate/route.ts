import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { teamMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { validateEvidence } from '@/lib/evidences/service';
import { z } from 'zod';

const validateEvidenceSchema = z.object({
  status: z.enum(['valid', 'invalid', 'needs_review']),
  notes: z.string().optional(),
});

/**
 * POST /api/evidences/[id]/validate
 * Validate an evidence document
 */
export async function POST(
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
    const validationResult = validateEvidenceSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { status, notes } = validationResult.data;

    const updatedEvidence = await validateEvidence(
      evidenceId,
      membership.teamId,
      user.id,
      status,
      notes
    );

    return NextResponse.json(updatedEvidence);
  } catch (error) {
    console.error('Error validating evidence:', error);
    const message = error instanceof Error ? error.message : 'Failed to validate evidence';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
