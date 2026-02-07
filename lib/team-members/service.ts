import { db } from '@/lib/db/drizzle';
import {
  teamMembersProfiles,
  users,
  teams,
  type TeamMemberProfile,
  type NewTeamMemberProfile,
  type TeamMemberRegistrationData,
  type TeamMemberRegistrationResponse
} from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { validateEmailGlobal } from '@/lib/validation/email-global';
import { ActivityType } from '@/lib/db/schema';
import { logActivity } from '@/lib/activity/service';

// ============================================
// FUNCIONES DE VALIDACIÓN
// ============================================

/**
 * Valida si el usuario puede ser agregado como team member a la agencia
 */
export async function validateTeamMemberEligibility(
  userId: string,
  agencyId: string
): Promise<{ eligible: boolean; reason?: string }> {
  try {
    // Verificar que la agencia existe
    const agency = await db.select().from(teams).where(eq(teams.id, parseInt(agencyId))).limit(1);
    if (agency.length === 0) {
      return { eligible: false, reason: 'Agency not found' };
    }

    // Verificar que el usuario no sea ya member de esta agencia
    const existingMember = await db
      .select()
      .from(teamMembersProfiles)
      .where(
        and(
          eq(teamMembersProfiles.userId, parseInt(userId)),
          eq(teamMembersProfiles.agencyId, parseInt(agencyId))
        )
      )
      .limit(1);

    if (existingMember.length > 0) {
      return { eligible: false, reason: 'User is already a member of this agency' };
    }

    return { eligible: true };
  } catch (error) {
    console.error('Error validating team member eligibility:', error);
    return { eligible: false, reason: 'Validation failed' };
  }
}

// ============================================
// FUNCIONES CRUD
// ============================================

/**
 * Crear nuevo team member
 */
export async function createTeamMember(
  data: TeamMemberRegistrationData,
  agencyId: string,
  invitedByUserId?: string
): Promise<TeamMemberRegistrationResponse> {
  try {
    // Validar email único si se proporciona
    if (data.email) {
      const emailValidation = await validateEmailGlobal(data.email);
      if (!emailValidation.available) {
        // Solo advertencia, no bloquear (filosofía permisiva)
        console.warn('Email already exists, but allowing registration:', data.email);
      }
    }

    // Buscar usuario existente por email o crear uno nuevo
    let userId: number;
    let userCreated = false;

    if (data.email) {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email))
        .limit(1);

      if (existingUser.length > 0) {
        userId = existingUser[0].id;

        // Validar elegibilidad
        const eligibility = await validateTeamMemberEligibility(userId.toString(), agencyId);
        if (!eligibility.eligible) {
          throw new Error(eligibility.reason || 'User not eligible');
        }
      } else {
        // Crear nuevo usuario (pendiente de activación)
        const [newUser] = await db
          .insert(users)
          .values({
            name: data.fullName || 'Team Member',
            email: data.email,
            passwordHash: 'PENDING_ACTIVATION', // Usuario debe activar cuenta
            role: 'staff',
            profileType: 'team_member'
          })
          .returning();

        userId = newUser.id;
        userCreated = true;
      }
    } else {
      throw new Error('Email is required for team member registration');
    }

    // Crear perfil de team member
    const teamMemberData: NewTeamMemberProfile = {
      userId,
      agencyId: parseInt(agencyId),
      fullName: data.fullName || null,
      email: data.email || null,
      phone: data.phone || null,
      role: data.role,
      customRoleDescription: data.customRoleDescription || null,
      specialties: data.specialties || null,
      customSpecialties: data.customSpecialties || null,
      barNumber: data.role === 'attorney' ? (data.barNumber || null) : null,
      barState: data.role === 'attorney' ? (data.barState || null) : null,
      profilePhotoUrl: data.profilePhotoUrl || null,
      bio: data.bio || null,
      languages: data.languages || null,
      customLanguages: data.customLanguages || null,
    };

    const [teamMember] = await db
      .insert(teamMembersProfiles)
      .values(teamMemberData)
      .returning();

    // Registrar actividad
    if (invitedByUserId) {
      await logActivity({
        userId: parseInt(invitedByUserId),
        teamId: parseInt(agencyId),
        action: 'INVITE_TEAM_MEMBER',
        description: `Invited ${data.fullName || data.email} as ${data.role}`,
        metadata: {
          teamMemberId: teamMember.id,
          role: data.role,
          email: data.email
        }
      });
    }

    return {
      success: true,
      teamMemberId: teamMember.id.toString(),
      agencyId,
      userCreated
    };

  } catch (error) {
    console.error('Error creating team member:', error);
    throw error;
  }
}

/**
 * Obtener team member por ID
 */
export async function getTeamMemberById(teamMemberId: string): Promise<TeamMemberProfile | null> {
  try {
    const [teamMember] = await db
      .select()
      .from(teamMembersProfiles)
      .where(eq(teamMembersProfiles.id, parseInt(teamMemberId)))
      .limit(1);

    return teamMember || null;
  } catch (error) {
    console.error('Error fetching team member:', error);
    return null;
  }
}

/**
 * Obtener team member por user ID
 */
export async function getTeamMemberByUserId(userId: string): Promise<TeamMemberProfile | null> {
  try {
    const [teamMember] = await db
      .select()
      .from(teamMembersProfiles)
      .where(eq(teamMembersProfiles.userId, parseInt(userId)))
      .limit(1);

    return teamMember || null;
  } catch (error) {
    console.error('Error fetching team member by user ID:', error);
    return null;
  }
}

/**
 * Obtener todos los team members de una agencia
 */
export async function getTeamMembersByAgency(agencyId: string): Promise<(TeamMemberProfile & { user: { name: string | null; email: string } })[]> {
  try {
    const teamMembers = await db
      .select({
        id: teamMembersProfiles.id,
        userId: teamMembersProfiles.userId,
        agencyId: teamMembersProfiles.agencyId,
        fullName: teamMembersProfiles.fullName,
        email: teamMembersProfiles.email,
        phone: teamMembersProfiles.phone,
        role: teamMembersProfiles.role,
        customRoleDescription: teamMembersProfiles.customRoleDescription,
        specialties: teamMembersProfiles.specialties,
        customSpecialties: teamMembersProfiles.customSpecialties,
        barNumber: teamMembersProfiles.barNumber,
        barState: teamMembersProfiles.barState,
        profilePhotoUrl: teamMembersProfiles.profilePhotoUrl,
        bio: teamMembersProfiles.bio,
        languages: teamMembersProfiles.languages,
        customLanguages: teamMembersProfiles.customLanguages,
        createdAt: teamMembersProfiles.createdAt,
        updatedAt: teamMembersProfiles.updatedAt,
        user: {
          name: users.name,
          email: users.email,
        },
      })
      .from(teamMembersProfiles)
      .innerJoin(users, eq(teamMembersProfiles.userId, users.id))
      .where(eq(teamMembersProfiles.agencyId, parseInt(agencyId)));

    return teamMembers;
  } catch (error) {
    console.error('Error fetching team members by agency:', error);
    return [];
  }
}

/**
 * Actualizar team member
 */
export async function updateTeamMember(
  teamMemberId: string,
  updates: Partial<TeamMemberRegistrationData>,
  updatedByUserId: string
): Promise<{ success: boolean }> {
  try {
    // Construir objeto de updates
    const updateData: Partial<NewTeamMemberProfile> = {};

    if (updates.fullName !== undefined) updateData.fullName = updates.fullName;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.role !== undefined) updateData.role = updates.role;
    if (updates.customRoleDescription !== undefined) updateData.customRoleDescription = updates.customRoleDescription;
    if (updates.specialties !== undefined) updateData.specialties = updates.specialties;
    if (updates.customSpecialties !== undefined) updateData.customSpecialties = updates.customSpecialties;
    if (updates.barNumber !== undefined) updateData.barNumber = updates.barNumber;
    if (updates.barState !== undefined) updateData.barState = updates.barState;
    if (updates.profilePhotoUrl !== undefined) updateData.profilePhotoUrl = updates.profilePhotoUrl;
    if (updates.bio !== undefined) updateData.bio = updates.bio;
    if (updates.languages !== undefined) updateData.languages = updates.languages;
    if (updates.customLanguages !== undefined) updateData.customLanguages = updates.customLanguages;

    // Agregar timestamp de actualización
    updateData.updatedAt = new Date();

    // Validar email si se está actualizando
    if (updates.email) {
      const emailValidation = await validateEmailGlobal(updates.email);
      if (!emailValidation.available) {
        console.warn('Email already exists, but allowing update:', updates.email);
      }
    }

    await db
      .update(teamMembersProfiles)
      .set(updateData)
      .where(eq(teamMembersProfiles.id, parseInt(teamMemberId)));

    // Registrar actividad
    await logActivity({
      userId: parseInt(updatedByUserId),
      teamId: null, // TODO: Obtener agencyId del team member
      action: 'UPDATE_TEAM_MEMBER',
      description: `Updated team member profile`,
      metadata: {
        teamMemberId,
        updatedFields: Object.keys(updateData)
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating team member:', error);
    throw error;
  }
}

/**
 * Eliminar team member
 */
export async function deleteTeamMember(
  teamMemberId: string,
  deletedByUserId: string
): Promise<{ success: boolean }> {
  try {
    // Obtener información antes de eliminar
    const teamMember = await getTeamMemberById(teamMemberId);
    if (!teamMember) {
      throw new Error('Team member not found');
    }

    await db
      .delete(teamMembersProfiles)
      .where(eq(teamMembersProfiles.id, parseInt(teamMemberId)));

    // Registrar actividad
    await logActivity({
      userId: parseInt(deletedByUserId),
      teamId: teamMember.agencyId,
      action: 'REMOVE_TEAM_MEMBER',
      description: `Removed team member: ${teamMember.fullName || teamMember.email}`,
      metadata: {
        teamMemberId,
        removedMember: {
          name: teamMember.fullName,
          email: teamMember.email,
          role: teamMember.role
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting team member:', error);
    throw error;
  }
}

// ============================================
// FUNCIONES DE BÚSQUEDA Y FILTRADO
// ============================================

/**
 * Buscar team members por rol
 */
export async function getTeamMembersByRole(
  agencyId: string,
  role: TeamMemberRegistrationData['role']
): Promise<TeamMemberProfile[]> {
  try {
    const teamMembers = await db
      .select()
      .from(teamMembersProfiles)
      .where(
        and(
          eq(teamMembersProfiles.agencyId, parseInt(agencyId)),
          eq(teamMembersProfiles.role, role)
        )
      );

    return teamMembers;
  } catch (error) {
    console.error('Error fetching team members by role:', error);
    return [];
  }
}

/**
 * Buscar team members por especialidad
 */
export async function getTeamMembersBySpecialty(
  agencyId: string,
  specialty: string
): Promise<TeamMemberProfile[]> {
  try {
    const teamMembers = await db
      .select()
      .from(teamMembersProfiles)
      .where(
        and(
          eq(teamMembersProfiles.agencyId, parseInt(agencyId)),
          sql`${teamMembersProfiles.specialties} @> ${[specialty]}`
        )
      );

    return teamMembers;
  } catch (error) {
    console.error('Error fetching team members by specialty:', error);
    return [];
  }
}

// ============================================
// FUNCIONES DE ESTADÍSTICAS
// ============================================

/**
 * Obtener estadísticas de team members de una agencia
 */
export async function getTeamMemberStats(agencyId: string): Promise<{
  totalMembers: number;
  byRole: Record<string, number>;
  attorneys: number;
  activeMembers: number;
}> {
  try {
    const stats = await db
      .select({
        total: sql<number>`count(*)`,
        role: teamMembersProfiles.role,
      })
      .from(teamMembersProfiles)
      .where(eq(teamMembersProfiles.agencyId, parseInt(agencyId)))
      .groupBy(teamMembersProfiles.role);

    const byRole: Record<string, number> = {};
    let totalMembers = 0;
    let attorneys = 0;

    for (const stat of stats) {
      byRole[stat.role] = stat.total;
      totalMembers += stat.total;
      if (stat.role === 'attorney') {
        attorneys = stat.total;
      }
    }

    return {
      totalMembers,
      byRole,
      attorneys,
      activeMembers: totalMembers, // TODO: Implementar lógica de usuarios activos
    };
  } catch (error) {
    console.error('Error fetching team member stats:', error);
    return {
      totalMembers: 0,
      byRole: {},
      attorneys: 0,
      activeMembers: 0,
    };
  }
}