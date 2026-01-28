import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { teamMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createEvidence, getEvidencesForCase } from '@/lib/evidences/service';
import { z } from 'zod';

const createEvidenceSchema = z.object({
  caseId: z.coerce.number().int().positive(),
  caseFormId: z.coerce.number().int().positive().optional(),
  fileName: z.string().min(1),
  fileType: z.string().optional(),
  fileSize: z.coerce.number().int().positive().optional(),
  fileUrl: z.string().url(),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  documentDate: z.string().optional(),
});

/**
 * GET /api/evidences?caseId=X
 * Get evidences for a case
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
    const caseId = searchParams.get('caseId');

    if (!caseId) {
      return NextResponse.json({ error: 'caseId is required' }, { status: 400 });
    }

    const filters = {
      caseFormId: searchParams.get('caseFormId')
        ? parseInt(searchParams.get('caseFormId')!)
        : undefined,
      category: searchParams.get('category') || undefined,
      validationStatus: searchParams.get('validationStatus') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0,
    };

    const result = await getEvidencesForCase(parseInt(caseId), membership.teamId, filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching evidences:', error);
    return NextResponse.json({ error: 'Failed to fetch evidences' }, { status: 500 });
  }
}

/**
 * POST /api/evidences
 * Create a new evidence record
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

    const body = await request.json();
    const validationResult = createEvidenceSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const evidence = await createEvidence(validationResult.data, membership.teamId, user.id);

    return NextResponse.json(evidence, { status: 201 });
  } catch (error) {
    console.error('Error creating evidence:', error);
    const message = error instanceof Error ? error.message : 'Failed to create evidence';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
