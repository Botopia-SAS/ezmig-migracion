import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  getTeamMemberById,
  updateTeamMember,
  deleteTeamMember
} from '@/lib/team-members/service';
import { getUserProfile } from '@/lib/db/queries';
import type { TeamMemberRegistrationData } from '@/lib/db/schema';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teamMember = await getTeamMemberById(id);
    if (!teamMember) {
      return Response.json({ error: 'Team member not found' }, { status: 404 });
    }

    const userProfile = await getUserProfile(session.user.id);
    if (!userProfile || userProfile.teamId !== teamMember.agencyId) {
      return Response.json({ error: 'Access denied to this team member' }, { status: 403 });
    }

    return Response.json({
      success: true,
      data: teamMember
    });

  } catch (error) {
    console.error('GET team-member error:', error);
    return Response.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const existingTeamMember = await getTeamMemberById(id);
    if (!existingTeamMember) {
      return Response.json({ error: 'Team member not found' }, { status: 404 });
    }

    const userProfile = await getUserProfile(session.user.id);
    if (!userProfile || userProfile.teamId !== existingTeamMember.agencyId) {
      return Response.json({ error: 'Access denied to this team member' }, { status: 403 });
    }

    const canEdit = userProfile.role === 'admin' ||
                   userProfile.role === 'owner' ||
                   userProfile.userId === existingTeamMember.userId;

    if (!canEdit) {
      return Response.json({
        error: 'Insufficient permissions. Only admins, owners, or the team member themselves can edit.'
      }, { status: 403 });
    }

    const updateData: Partial<TeamMemberRegistrationData> = {};

    if (body.fullName !== undefined) updateData.fullName = body.fullName;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.customRoleDescription !== undefined) updateData.customRoleDescription = body.customRoleDescription;
    if (body.specialties !== undefined) updateData.specialties = body.specialties;
    if (body.customSpecialties !== undefined) updateData.customSpecialties = body.customSpecialties;
    if (body.barNumber !== undefined) updateData.barNumber = body.barNumber;
    if (body.barState !== undefined) updateData.barState = body.barState;
    if (body.profilePhotoUrl !== undefined) updateData.profilePhotoUrl = body.profilePhotoUrl;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.languages !== undefined) updateData.languages = body.languages;
    if (body.customLanguages !== undefined) updateData.customLanguages = body.customLanguages;

    const result = await updateTeamMember(
      id,
      updateData,
      session.user.id.toString()
    );

    return Response.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('PUT team-member error:', error);
    return Response.json(
      {
        error: 'Failed to update team member',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingTeamMember = await getTeamMemberById(id);
    if (!existingTeamMember) {
      return Response.json({ error: 'Team member not found' }, { status: 404 });
    }

    const userProfile = await getUserProfile(session.user.id);
    if (!userProfile || userProfile.teamId !== existingTeamMember.agencyId) {
      return Response.json({ error: 'Access denied to this team member' }, { status: 403 });
    }

    if (userProfile.role !== 'admin' && userProfile.role !== 'owner') {
      return Response.json({
        error: 'Insufficient permissions. Only admins and owners can remove team members.'
      }, { status: 403 });
    }

    const result = await deleteTeamMember(id, session.user.id.toString());

    return Response.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('DELETE team-member error:', error);
    return Response.json(
      {
        error: 'Failed to delete team member',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
