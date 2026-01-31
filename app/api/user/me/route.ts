import { NextResponse } from 'next/server';
import { getUserWithTeam } from '@/lib/auth/rbac';

/**
 * GET /api/user/me
 * Returns current user with team and tenant role information
 * Used by RoleProvider to hydrate role context
 */
export async function GET() {
  try {
    const userWithTeam = await getUserWithTeam();

    if (!userWithTeam?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user: userWithTeam.user,
      team: userWithTeam.team,
      tenantRole: userWithTeam.tenantRole,
    });
  } catch (error) {
    console.error('Error fetching user with team:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user information' },
      { status: 500 }
    );
  }
}
