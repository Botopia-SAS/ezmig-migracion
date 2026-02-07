import { db } from '@/lib/db/drizzle';
import { teams, users, teamMembers, activityLogs } from '@/lib/db/schema';
import type {
  AgencyRegistrationData,
  AgencyRegistrationResponse,
  NewTeam,
  NewUser,
  NewTeamMember,
  NewActivityLog
} from '@/lib/db/schema';
import {
  calculateCompletionPercentage,
  determineAgencyStatus,
  validateDisclaimer
} from './utils';
import { hashPassword } from '@/lib/auth/session';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';

function generateRandomPassword(length = 16): string {
  return crypto.randomBytes(length).toString('base64url').slice(0, length);
}

/**
 * Registra una nueva agencia con todos sus datos
 * Filosofía: PERMISIVO - solo disclaimer es obligatorio
 */
export async function registerAgency(
  data: AgencyRegistrationData
): Promise<AgencyRegistrationResponse> {

  // 1. Validación única bloqueante: disclaimer para immigration_services
  const disclaimerValidation = validateDisclaimer(data);
  if (!disclaimerValidation.valid) {
    throw new Error(`DISCLAIMER_REQUIRED: ${disclaimerValidation.error}`);
  }

  // 2. Calcular completion percentage y determinar status
  const completionPercentage = calculateCompletionPercentage(data);
  const agencyStatus = determineAgencyStatus(completionPercentage);

  // 3. Preparar datos del team con campos de agencia
  const teamData: NewTeam = {
    name: data.legalBusinessName || `${data.agencyType === 'law_firm' ? 'Law Firm' : 'Immigration Services'} - ${Date.now()}`,

    // Campos de agencia
    agencyType: data.agencyType,
    agencyStatus,
    completionPercentage,

    // Información básica de empresa
    legalBusinessName: data.legalBusinessName || null,
    businessNameDba: data.businessNameDba || null,
    businessEmail: data.businessEmail || null,
    businessPhone: data.businessPhone || null,
    website: data.website || null,

    // Dirección
    address: data.address || null,
    city: data.city || null,
    state: data.state || null,
    zipCode: data.zipCode || null,
    country: 'USA',

    // Google Maps
    googlePlaceId: data.googlePlaceId || null,
    coordinatesLat: data.coordinatesLat || null,
    coordinatesLng: data.coordinatesLng || null,

    // Campos específicos por tipo
    firmRegistrationNumber: data.firmRegistrationNumber || null,
    firmRegistrationState: data.firmRegistrationState || null,
    businessLicenseNumber: data.businessLicenseNumber || null,
    disclaimerAccepted: data.disclaimerAccepted || false,
    disclaimerAcceptedAt: data.disclaimerAccepted ? new Date() : null,

    // Información del owner
    ownerFullName: data.ownerFullName || null,
    ownerPosition: data.ownerPosition || null,
    ownerEmail: data.ownerEmail || null,
    ownerPhone: data.ownerPhone || null,

    createdAt: new Date(),
    updatedAt: new Date()
  };

  // 4. Crear el team/agencia
  const [createdTeam] = await db.insert(teams).values(teamData).returning();

  // 5. Crear usuario admin automáticamente si se proporcionó email
  let userCreated = false;
  let userId: number | undefined;

  if (data.ownerEmail) {
    try {
      // Generar password temporal
      const temporaryPassword = generateRandomPassword();
      const hashedPassword = await hashPassword(temporaryPassword);

      const userData: NewUser = {
        name: data.ownerFullName || data.ownerEmail.split('@')[0],
        email: data.ownerEmail,
        passwordHash: hashedPassword,
        role: 'attorney', // Los owners de agencia son attorneys
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const [createdUser] = await db.insert(users).values(userData).returning();
      userId = createdUser.id;

      // Crear membership como owner
      const memberData: NewTeamMember = {
        userId: createdUser.id,
        teamId: createdTeam.id,
        role: 'owner',
        joinedAt: new Date()
      };

      await db.insert(teamMembers).values(memberData);

      userCreated = true;

      // TODO: Enviar email de bienvenida con link para configurar password
      // await sendWelcomeEmail(data.ownerEmail, createdTeam.id, temporaryPassword);

    } catch (error) {
      console.error('Error creating owner user:', error);
      // No fallar todo el registro por esto, solo continuar sin usuario
    }
  }

  // 6. Log de actividad
  if (userId) {
    const activityData: NewActivityLog = {
      teamId: createdTeam.id,
      userId,
      action: 'REGISTER_AGENCY',
      entityType: 'team',
      entityId: createdTeam.id,
      entityName: createdTeam.name,
      metadata: {
        agency_type: data.agencyType,
        completion_percentage: completionPercentage,
        user_created: userCreated
      },
      timestamp: new Date()
    };

    await db.insert(activityLogs).values(activityData);
  }

  return {
    success: true,
    teamId: createdTeam.id.toString(),
    agencyStatus,
    completionPercentage,
    userCreated
  };
}

/**
 * Valida si un email ya existe en el sistema
 */
export async function validateEmailAvailability(email: string): Promise<{ available: boolean; email: string }> {
  // Verificar en usuarios
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);

  // Verificar en teams (business emails)
  const existingTeam = await db.select().from(teams).where(eq(teams.businessEmail, email)).limit(1);

  // Verificar en teams (owner emails)
  const existingOwnerEmail = await db.select().from(teams).where(eq(teams.ownerEmail, email)).limit(1);

  const available = existingUser.length === 0 && existingTeam.length === 0 && existingOwnerEmail.length === 0;

  return { available, email };
}

/**
 * Obtiene datos completos de una agencia por ID
 */
export async function getAgencyById(teamId: number) {
  const [team] = await db.select().from(teams).where(eq(teams.id, teamId));
  return team;
}

/**
 * Actualiza configuraciones de una agencia
 * Respeta permisos según el rol del usuario
 */
export async function updateAgencySettings(
  teamId: number,
  updates: Partial<AgencyRegistrationData>,
  userId: number
): Promise<{ success: boolean; message?: string }> {

  // TODO: Validar permisos usando validateAgencyPermission
  // por ahora permitir todas las actualizaciones para MVP

  // Recalcular completion_percentage si se modifican campos importantes
  const currentTeam = await getAgencyById(teamId);
  if (!currentTeam) {
    throw new Error('Agency not found');
  }

  // Merge current data con updates para recalcular
  const mergedData: AgencyRegistrationData = {
    agencyType: currentTeam.agencyType!,
    legalBusinessName: updates.legalBusinessName || currentTeam.legalBusinessName || '',
    businessEmail: updates.businessEmail || currentTeam.businessEmail || '',
    businessPhone: updates.businessPhone || currentTeam.businessPhone || '',
    address: updates.address || currentTeam.address || '',
    city: updates.city || currentTeam.city || '',
    state: updates.state || currentTeam.state || '',
    zipCode: updates.zipCode || currentTeam.zipCode || '',
    ownerFullName: updates.ownerFullName || currentTeam.ownerFullName || '',
    ownerEmail: updates.ownerEmail || currentTeam.ownerEmail || '',
    ...updates
  };

  const newCompletionPercentage = calculateCompletionPercentage(mergedData);
  const newStatus = determineAgencyStatus(newCompletionPercentage);

  // Preparar campos de actualización
  const updateData: Partial<NewTeam> = {
    ...updates,
    completionPercentage: newCompletionPercentage,
    agencyStatus: newStatus,
    updatedAt: new Date()
  };

  // Actualizar team
  await db.update(teams).set(updateData).where(eq(teams.id, teamId));

  // Log de actividad
  const activityData: NewActivityLog = {
    teamId,
    userId,
    action: 'UPDATE_AGENCY_SETTINGS',
    entityType: 'team',
    entityId: teamId,
    entityName: currentTeam.name,
    metadata: {
      fields_updated: Object.keys(updates),
      new_completion_percentage: newCompletionPercentage
    },
    timestamp: new Date()
  };

  await db.insert(activityLogs).values(activityData);

  return { success: true };
}

