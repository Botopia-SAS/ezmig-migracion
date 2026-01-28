import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { teamMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createCase, getCasesForTeam } from '@/lib/cases/service';
import { z } from 'zod';

// Validation schema for creating a case
const createCaseSchema = z.object({
  clientId: z.number().int().positive(),
  caseType: z.enum([
    'family_based',
    'employment',
    'asylum',
    'naturalization',
    'adjustment',
    'removal_defense',
    'visa',
    'other',
  ]),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  filingDeadline: z.string().optional(),
  assignedTo: z.number().int().positive().optional(),
  internalNotes: z.string().optional(),
});

/**
 * GET /api/cases
 * Get all cases for the user's team with optional filters
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
      return NextResponse.json({ error: 'No team membership found' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const caseType = searchParams.get('caseType') || undefined;
    const clientId = searchParams.get('clientId');
    const assignedTo = searchParams.get('assignedTo');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const result = await getCasesForTeam(membership.teamId, {
      search,
      status,
      caseType,
      clientId: clientId ? parseInt(clientId) : undefined,
      assignedTo: assignedTo ? parseInt(assignedTo) : undefined,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching cases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cases' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cases
 * Create a new case
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
      return NextResponse.json({ error: 'No team membership found' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createCaseSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Create the case
    const newCase = await createCase({
      teamId: membership.teamId,
      createdBy: user.id,
      ...data,
    });

    return NextResponse.json(newCase, { status: 201 });
  } catch (error) {
    console.error('Error creating case:', error);
    return NextResponse.json(
      { error: 'Failed to create case' },
      { status: 500 }
    );
  }
}
