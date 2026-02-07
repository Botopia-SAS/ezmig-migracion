import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  createTeamMember,
  getTeamMembersByAgency
} from '@/lib/team-members/service';
import { getUserProfile } from '@/lib/db/queries';
import type { TeamMemberRegistrationData } from '@/lib/db/schema';

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

    const teamMembers = await getTeamMembersByAgency(agencyId);

    return Response.json({
      success: true,
      data: teamMembers
    });

  } catch (error) {
    console.error('GET team-members error:', error);
    return Response.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { agencyId, teamMemberData } = body;

    if (!agencyId || !teamMemberData) {
      return Response.json({
        error: 'Missing required fields: agencyId, teamMemberData'
      }, { status: 400 });
    }

    // Verificar que el usuario tenga acceso a esta agencia
    const userProfile = await getUserProfile(session.user.id);
    if (!userProfile || userProfile.teamId !== parseInt(agencyId)) {
      return Response.json({ error: 'Access denied to this agency' }, { status: 403 });
    }

    // Verificar rol de administrador
    if (userProfile.role !== 'admin' && userProfile.role !== 'owner') {
      return Response.json({
        error: 'Insufficient permissions. Only admins and owners can invite team members.'
      }, { status: 403 });
    }

    // Validar datos del team member
    const registrationData: TeamMemberRegistrationData = {
      fullName: teamMemberData.fullName,
      email: teamMemberData.email,
      phone: teamMemberData.phone,
      role: teamMemberData.role,
      customRoleDescription: teamMemberData.customRoleDescription,
      specialties: teamMemberData.specialties,
      customSpecialties: teamMemberData.customSpecialties,
      barNumber: teamMemberData.barNumber,
      barState: teamMemberData.barState,
      profilePhotoUrl: teamMemberData.profilePhotoUrl,
      bio: teamMemberData.bio,
      languages: teamMemberData.languages,
      customLanguages: teamMemberData.customLanguages
    };

    const result = await createTeamMember(
      registrationData,
      agencyId.toString(),
      session.user.id.toString()
    );

    return Response.json({
      success: true,
      data: result
    }, { status: 201 });

  } catch (error) {
    console.error('POST team-members error:', error);
    return Response.json(
      {
        error: 'Failed to create team member',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}