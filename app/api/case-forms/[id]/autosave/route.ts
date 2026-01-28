import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { teamMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { autosaveField } from '@/lib/forms/service';
import { z } from 'zod';

const autosaveSchema = z.object({
  fieldPath: z.string().min(1),
  fieldValue: z.string().nullable(),
});

/**
 * POST /api/case-forms/[id]/autosave
 * Autosave a single field value
 */
export async function POST(
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
    const validationResult = autosaveSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { fieldPath, fieldValue } = validationResult.data;

    await autosaveField(
      caseFormId,
      membership.teamId,
      user.id,
      fieldPath,
      fieldValue
    );

    return NextResponse.json({ success: true, savedAt: new Date().toISOString() });
  } catch (error) {
    console.error('Error autosaving field:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to autosave field';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
