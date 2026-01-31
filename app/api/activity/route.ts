import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { teamMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getTeamActivityLogs } from '@/lib/activity';
import type { EntityType } from '@/lib/activity';

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's team
    const membership = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.userId, user.id))
      .limit(1);

    if (!membership[0]) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    const teamId = membership[0].teamId;
    const tenantRole = membership[0].role;

    // Only owner and staff can view activity logs
    if (tenantRole === 'client') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const userId = searchParams.get('userId')
      ? parseInt(searchParams.get('userId')!, 10)
      : undefined;
    const entityType = searchParams.get('entityType') as EntityType | undefined;
    const entityId = searchParams.get('entityId')
      ? parseInt(searchParams.get('entityId')!, 10)
      : undefined;
    const action = searchParams.get('action') || undefined;
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate')!)
      : undefined;
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate')!)
      : undefined;
    const search = searchParams.get('search') || undefined;

    const result = await getTeamActivityLogs(teamId, {
      limit,
      offset,
      userId,
      entityType,
      entityId,
      action: action as any,
      startDate,
      endDate,
      search,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
