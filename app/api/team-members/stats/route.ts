import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getTeamMemberStats } from '@/lib/team-members/service';
import { getUserProfile } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get('agencyId');

    if (!agencyId) {
      return Response.json({ error: 'Agency ID is required' }, { status: 400 });
    }

    // Verificar que el usuario tenga acceso a esta agencia
    const userProfile = await getUserProfile(session.user.id);
    if (!userProfile || userProfile.teamId !== parseInt(agencyId)) {
      return Response.json({ error: 'Access denied to this agency' }, { status: 403 });
    }

    const stats = await getTeamMemberStats(agencyId);

    return Response.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('GET team-members stats error:', error);
    return Response.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}