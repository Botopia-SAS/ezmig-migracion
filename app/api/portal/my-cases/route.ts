import { NextResponse } from 'next/server';
import { getUserWithTeam } from '@/lib/auth/rbac';
import { getCasesForClient } from '@/lib/cases/service';

/**
 * GET /api/portal/my-cases
 * Get all cases for the authenticated client user
 * Only accessible by users with 'client' tenant role
 */
export async function GET() {
  try {
    const userWithTeam = await getUserWithTeam();
    if (!userWithTeam?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only clients can access this endpoint
    if (userWithTeam.tenantRole !== 'client') {
      return NextResponse.json(
        { error: 'Forbidden - This endpoint is only for clients' },
        { status: 403 }
      );
    }

    // Get cases for this client
    const result = await getCasesForClient(userWithTeam.user.id);

    if (!result.client) {
      return NextResponse.json(
        { error: 'No client profile found for this user' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      cases: result.cases,
      client: {
        id: result.client.id,
        firstName: result.client.firstName,
        lastName: result.client.lastName,
        email: result.client.email,
      },
    });
  } catch (error) {
    console.error('Error fetching client cases:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cases' },
      { status: 500 }
    );
  }
}
