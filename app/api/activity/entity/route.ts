import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { teamMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getEntityActivityLogs } from '@/lib/activity';
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
    const entityType = searchParams.get('type') as EntityType;
    const entityId = searchParams.get('id')
      ? parseInt(searchParams.get('id')!, 10)
      : null;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'Missing required params: type and id' },
        { status: 400 }
      );
    }

    const logs = await getEntityActivityLogs(entityType, entityId, teamId, limit);

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching entity activity logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
