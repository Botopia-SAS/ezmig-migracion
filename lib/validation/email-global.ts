import { db } from '@/lib/db/drizzle';
import { users, teamMembersProfiles, freelancersProfiles } from '@/lib/db/schema';
import { or, eq, and, not } from 'drizzle-orm';

export interface EmailValidationResult {
  available: boolean;
  conflictTable?: 'users' | 'team_members' | 'freelancers';
  conflictId?: number;
  message?: string;
}

/**
 * Valida si un email está disponible globalmente en todo el sistema
 * Siguiendo la filosofía permisiva: no bloquea pero informa del conflicto
 */
export async function validateEmailGlobal(email: string): Promise<EmailValidationResult> {
  try {
    if (!email || !email.trim()) {
      return {
        available: true,
        message: 'No email provided'
      };
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Buscar en tabla users
    const userConflict = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (userConflict.length > 0) {
      return {
        available: false,
        conflictTable: 'users',
        conflictId: userConflict[0].id,
        message: `Email already exists in users table (ID: ${userConflict[0].id})`
      };
    }

    // Buscar en tabla team_members_profiles
    const teamMemberConflict = await db
      .select({ id: teamMembersProfiles.id, email: teamMembersProfiles.email })
      .from(teamMembersProfiles)
      .where(eq(teamMembersProfiles.email, normalizedEmail))
      .limit(1);

    if (teamMemberConflict.length > 0) {
      return {
        available: false,
        conflictTable: 'team_members',
        conflictId: teamMemberConflict[0].id,
        message: `Email already exists in team members table (ID: ${teamMemberConflict[0].id})`
      };
    }

    // Buscar en tabla freelancers_profiles
    const freelancerConflict = await db
      .select({ id: freelancersProfiles.id, email: freelancersProfiles.email })
      .from(freelancersProfiles)
      .where(eq(freelancersProfiles.email, normalizedEmail))
      .limit(1);

    if (freelancerConflict.length > 0) {
      return {
        available: false,
        conflictTable: 'freelancers',
        conflictId: freelancerConflict[0].id,
        message: `Email already exists in freelancers table (ID: ${freelancerConflict[0].id})`
      };
    }

    return {
      available: true,
      message: 'Email is available'
    };

  } catch (error) {
    console.error('Error validating email globally:', error);
    return {
      available: true, // Filosofía permisiva: en caso de error, permitir continuar
      message: 'Validation failed, allowing registration to continue'
    };
  }
}

/**
 * Valida si un email está disponible excluyendo una tabla específica
 * Útil para actualizaciones donde el mismo registro puede mantener su email
 */
export async function validateEmailGlobalExcluding(
  email: string,
  excludeTable: 'users' | 'team_members' | 'freelancers',
  excludeId: number
): Promise<EmailValidationResult> {
  try {
    if (!email || !email.trim()) {
      return {
        available: true,
        message: 'No email provided'
      };
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Buscar en users si no es la tabla excluida
    if (excludeTable !== 'users') {
      const userConflict = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1);

      if (userConflict.length > 0) {
        return {
          available: false,
          conflictTable: 'users',
          conflictId: userConflict[0].id,
          message: `Email already exists in users table`
        };
      }
    } else {
      // Si es users, excluir el ID específico
      const userConflict = await db
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.email, normalizedEmail),
            not(eq(users.id, excludeId))
          )
        )
        .limit(1);

      if (userConflict.length > 0) {
        return {
          available: false,
          conflictTable: 'users',
          conflictId: userConflict[0].id,
          message: `Email already exists in users table`
        };
      }
    }

    // Buscar en team_members si no es la tabla excluida
    if (excludeTable !== 'team_members') {
      const teamMemberConflict = await db
        .select({ id: teamMembersProfiles.id })
        .from(teamMembersProfiles)
        .where(eq(teamMembersProfiles.email, normalizedEmail))
        .limit(1);

      if (teamMemberConflict.length > 0) {
        return {
          available: false,
          conflictTable: 'team_members',
          conflictId: teamMemberConflict[0].id,
          message: `Email already exists in team members table`
        };
      }
    } else {
      // Si es team_members, excluir el ID específico
      const teamMemberConflict = await db
        .select({ id: teamMembersProfiles.id })
        .from(teamMembersProfiles)
        .where(
          and(
            eq(teamMembersProfiles.email, normalizedEmail),
            not(eq(teamMembersProfiles.id, excludeId))
          )
        )
        .limit(1);

      if (teamMemberConflict.length > 0) {
        return {
          available: false,
          conflictTable: 'team_members',
          conflictId: teamMemberConflict[0].id,
          message: `Email already exists in team members table`
        };
      }
    }

    // Buscar en freelancers si no es la tabla excluida
    if (excludeTable !== 'freelancers') {
      const freelancerConflict = await db
        .select({ id: freelancersProfiles.id })
        .from(freelancersProfiles)
        .where(eq(freelancersProfiles.email, normalizedEmail))
        .limit(1);

      if (freelancerConflict.length > 0) {
        return {
          available: false,
          conflictTable: 'freelancers',
          conflictId: freelancerConflict[0].id,
          message: `Email already exists in freelancers table`
        };
      }
    } else {
      // Si es freelancers, excluir el ID específico
      const freelancerConflict = await db
        .select({ id: freelancersProfiles.id })
        .from(freelancersProfiles)
        .where(
          and(
            eq(freelancersProfiles.email, normalizedEmail),
            not(eq(freelancersProfiles.id, excludeId))
          )
        )
        .limit(1);

      if (freelancerConflict.length > 0) {
        return {
          available: false,
          conflictTable: 'freelancers',
          conflictId: freelancerConflict[0].id,
          message: `Email already exists in freelancers table`
        };
      }
    }

    return {
      available: true,
      message: 'Email is available'
    };

  } catch (error) {
    console.error('Error validating email globally:', error);
    return {
      available: true,
      message: 'Validation failed, allowing update to continue'
    };
  }
}

/**
 * Busca todos los conflictos de email en el sistema
 * Útil para reportes o limpieza de datos
 */
export async function findAllEmailConflicts(email: string): Promise<{
  users: { id: number; email: string }[];
  teamMembers: { id: number; email: string | null }[];
  freelancers: { id: number; email: string | null }[];
}> {
  try {
    const normalizedEmail = email.trim().toLowerCase();

    const [usersConflicts, teamMembersConflicts, freelancersConflicts] = await Promise.all([
      db.select({ id: users.id, email: users.email })
        .from(users)
        .where(eq(users.email, normalizedEmail)),

      db.select({ id: teamMembersProfiles.id, email: teamMembersProfiles.email })
        .from(teamMembersProfiles)
        .where(eq(teamMembersProfiles.email, normalizedEmail)),

      db.select({ id: freelancersProfiles.id, email: freelancersProfiles.email })
        .from(freelancersProfiles)
        .where(eq(freelancersProfiles.email, normalizedEmail))
    ]);

    return {
      users: usersConflicts,
      teamMembers: teamMembersConflicts,
      freelancers: freelancersConflicts
    };

  } catch (error) {
    console.error('Error finding email conflicts:', error);
    return {
      users: [],
      teamMembers: [],
      freelancers: []
    };
  }
}