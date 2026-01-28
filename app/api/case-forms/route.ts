import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { teamMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createCaseForm, getCaseFormsForCase } from '@/lib/forms/service';
import { z } from 'zod';

const createCaseFormSchema = z.object({
  caseId: z.number().int().positive(),
  formTypeId: z.number().int().positive(),
});

/**
 * GET /api/case-forms?caseId=123
 * Get all forms for a specific case
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

    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get('caseId');

    if (!caseId) {
      return NextResponse.json(
        { error: 'caseId is required' },
        { status: 400 }
      );
    }

    const forms = await getCaseFormsForCase(
      parseInt(caseId),
      membership.teamId
    );

    return NextResponse.json({ forms });
  } catch (error) {
    console.error('Error fetching case forms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch case forms' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/case-forms
 * Add a form to a case
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

    const body = await request.json();
    const validationResult = createCaseFormSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const newForm = await createCaseForm(
      validationResult.data,
      membership.teamId,
      user.id
    );

    return NextResponse.json(newForm, { status: 201 });
  } catch (error) {
    console.error('Error creating case form:', error);
    const message =
      error instanceof Error ? error.message : 'Failed to create case form';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
