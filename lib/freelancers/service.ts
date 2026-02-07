import { db } from '@/lib/db/drizzle';
import {
  freelancersProfiles,
  users,
  type FreelancerProfile,
  type NewFreelancerProfile,
  type FreelancerRegistrationData,
  type FreelancerRegistrationResponse,
  type SpecialtyType,
  type LanguageType
} from '@/lib/db/schema';
import { eq, and, sql, like, or, ilike } from 'drizzle-orm';
import { validateEmailGlobal } from '@/lib/validation/email-global';
import { ActivityType } from '@/lib/db/schema';
import { logActivity } from '@/lib/activity/service';

// ============================================
// FUNCIONES DE VALIDACIÓN
// ============================================

/**
 * Valida los datos de registro de freelancer
 */
export function validateFreelancerRegistration(
  data: FreelancerRegistrationData
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar tipo profesional (obligatorio)
  if (!data.professionalType) {
    errors.push('Professional type is required');
  }

  // Validar disclaimer para preparadores (ÚNICA validación bloqueante)
  if (data.professionalType === 'form_preparer' && !data.disclaimerAccepted) {
    errors.push('Disclaimer acceptance is required for form preparers');
  }

  // Validar años de experiencia si se proporciona
  if (data.yearsExperience !== undefined && (data.yearsExperience < 0 || data.yearsExperience > 60)) {
    errors.push('Years of experience must be between 0 and 60');
  }

  // Validar URLs si se proporcionan
  const urlFields = [
    { field: 'businessWebsite', value: data.businessWebsite },
    { field: 'linkedinUrl', value: data.linkedinUrl },
    { field: 'personalWebsite', value: data.personalWebsite }
  ];

  urlFields.forEach(({ field, value }) => {
    if (value && !isValidUrl(value)) {
      // Solo advertencia, no error bloqueante (filosofía permisiva)
      console.warn(`Invalid URL format for ${field}: ${value}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Valida formato de URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
}

// ============================================
// FUNCIONES CRUD
// ============================================

/**
 * Crear nuevo freelancer
 */
export async function createFreelancer(
  data: FreelancerRegistrationData,
  userEmail?: string
): Promise<FreelancerRegistrationResponse> {
  try {
    // Validar datos de entrada
    const validation = validateFreelancerRegistration(data);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Validar email único si se proporciona
    const email = data.email || userEmail;
    if (email) {
      const emailValidation = await validateEmailGlobal(email);
      if (!emailValidation.available) {
        console.warn('Email already exists, but allowing registration:', email);
      }
    }

    // Buscar usuario existente o crear uno nuevo
    let userId: number;
    let userCreated = false;

    if (email) {
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        userId = existingUser[0].id;

        // Verificar que no tenga ya un perfil de freelancer
        const existingFreelancer = await db
          .select()
          .from(freelancersProfiles)
          .where(eq(freelancersProfiles.userId, userId))
          .limit(1);

        if (existingFreelancer.length > 0) {
          throw new Error('User already has a freelancer profile');
        }
      } else {
        // Crear nuevo usuario
        const [newUser] = await db
          .insert(users)
          .values({
            name: data.fullName || 'Freelancer',
            email: email,
            passwordHash: 'PENDING_ACTIVATION',
            role: data.professionalType === 'immigration_attorney' ? 'attorney' : 'staff',
            profileType: 'freelancer'
          })
          .returning();

        userId = newUser.id;
        userCreated = true;
      }
    } else {
      throw new Error('Email is required for freelancer registration');
    }

    // Crear perfil de freelancer
    const freelancerData: NewFreelancerProfile = {
      userId,
      professionalType: data.professionalType,
      fullName: data.fullName || null,
      email: email || null,
      phone: data.phone || null,
      primaryState: data.primaryState || null,
      primaryCity: data.primaryCity || null,

      // Campos para abogados
      barNumber: data.professionalType === 'immigration_attorney' ? (data.barNumber || null) : null,
      primaryBarState: data.professionalType === 'immigration_attorney' ? (data.primaryBarState || null) : null,
      additionalBarStates: data.professionalType === 'immigration_attorney' ? (data.additionalBarStates || null) : null,
      specialties: data.professionalType === 'immigration_attorney' ? (data.specialties || null) : null,
      customSpecialties: data.professionalType === 'immigration_attorney' ? (data.customSpecialties || null) : null,

      // Campos para preparadores
      businessLicenseNumber: data.professionalType === 'form_preparer' ? (data.businessLicenseNumber || null) : null,
      disclaimerAccepted: data.professionalType === 'form_preparer' ? (data.disclaimerAccepted || false) : false,
      disclaimerAcceptedAt: (data.professionalType === 'form_preparer' && data.disclaimerAccepted) ? new Date() : null,

      // Información de empresa
      hasBusiness: data.hasBusiness || false,
      businessName: data.hasBusiness ? (data.businessName || null) : null,
      businessEntityType: data.hasBusiness ? (data.businessEntityType || null) : null,
      businessWebsite: data.hasBusiness ? (data.businessWebsite || null) : null,

      // Perfil profesional
      profilePhotoUrl: data.profilePhotoUrl || null,
      bio: data.bio || null,
      yearsExperience: data.yearsExperience || null,
      languages: data.languages || null,
      customLanguages: data.customLanguages || null,

      // Ubicación profesional
      officeAddress: data.officeAddress || null,
      officeCity: data.officeCity || null,
      officeState: data.officeState || null,
      officeZipCode: data.officeZipCode || null,
      googlePlaceId: data.googlePlaceId || null,
      coordinatesLat: data.coordinatesLat || null,
      coordinatesLng: data.coordinatesLng || null,

      // Redes
      linkedinUrl: data.linkedinUrl || null,
      personalWebsite: data.personalWebsite || null,
    };

    const [freelancer] = await db
      .insert(freelancersProfiles)
      .values(freelancerData)
      .returning();

    // Registrar actividad
    await logActivity({
      userId,
      teamId: null,
      action: 'CREATE_FREELANCER_PROFILE',
      description: `Created ${data.professionalType} freelancer profile`,
      metadata: {
        freelancerId: freelancer.id,
        professionalType: data.professionalType,
        email: email
      }
    });

    return {
      success: true,
      freelancerId: freelancer.id.toString(),
      userCreated
    };

  } catch (error) {
    console.error('Error creating freelancer:', error);
    throw error;
  }
}

/**
 * Obtener freelancer por ID
 */
export async function getFreelancerById(freelancerId: string): Promise<FreelancerProfile | null> {
  try {
    const [freelancer] = await db
      .select()
      .from(freelancersProfiles)
      .where(eq(freelancersProfiles.id, parseInt(freelancerId)))
      .limit(1);

    return freelancer || null;
  } catch (error) {
    console.error('Error fetching freelancer:', error);
    return null;
  }
}

/**
 * Obtener freelancer por user ID
 */
export async function getFreelancerByUserId(userId: string): Promise<FreelancerProfile | null> {
  try {
    const [freelancer] = await db
      .select()
      .from(freelancersProfiles)
      .where(eq(freelancersProfiles.userId, parseInt(userId)))
      .limit(1);

    return freelancer || null;
  } catch (error) {
    console.error('Error fetching freelancer by user ID:', error);
    return null;
  }
}

/**
 * Actualizar freelancer
 */
export async function updateFreelancer(
  freelancerId: string,
  updates: Partial<FreelancerRegistrationData>,
  updatedByUserId: string
): Promise<{ success: boolean }> {
  try {
    // Obtener freelancer actual para validaciones
    const freelancer = await getFreelancerById(freelancerId);
    if (!freelancer) {
      throw new Error('Freelancer not found');
    }

    // Construir objeto de updates
    const updateData: Partial<NewFreelancerProfile> = {};

    // Campos generales
    if (updates.fullName !== undefined) updateData.fullName = updates.fullName;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.primaryState !== undefined) updateData.primaryState = updates.primaryState;
    if (updates.primaryCity !== undefined) updateData.primaryCity = updates.primaryCity;

    // Campos para abogados (solo si es attorney)
    if (freelancer.professionalType === 'immigration_attorney') {
      if (updates.barNumber !== undefined) updateData.barNumber = updates.barNumber;
      if (updates.primaryBarState !== undefined) updateData.primaryBarState = updates.primaryBarState;
      if (updates.additionalBarStates !== undefined) updateData.additionalBarStates = updates.additionalBarStates;
      if (updates.specialties !== undefined) updateData.specialties = updates.specialties;
      if (updates.customSpecialties !== undefined) updateData.customSpecialties = updates.customSpecialties;
    }

    // Campos para preparadores (solo si es form_preparer)
    if (freelancer.professionalType === 'form_preparer') {
      if (updates.businessLicenseNumber !== undefined) updateData.businessLicenseNumber = updates.businessLicenseNumber;

      // Disclaimer no se puede cambiar una vez aceptado
      if (updates.disclaimerAccepted && !freelancer.disclaimerAccepted) {
        updateData.disclaimerAccepted = true;
        updateData.disclaimerAcceptedAt = new Date();
      }
    }

    // Información de empresa
    if (updates.hasBusiness !== undefined) updateData.hasBusiness = updates.hasBusiness;
    if (updates.businessName !== undefined) updateData.businessName = updates.businessName;
    if (updates.businessEntityType !== undefined) updateData.businessEntityType = updates.businessEntityType;
    if (updates.businessWebsite !== undefined) updateData.businessWebsite = updates.businessWebsite;

    // Perfil profesional
    if (updates.profilePhotoUrl !== undefined) updateData.profilePhotoUrl = updates.profilePhotoUrl;
    if (updates.bio !== undefined) updateData.bio = updates.bio;
    if (updates.yearsExperience !== undefined) updateData.yearsExperience = updates.yearsExperience;
    if (updates.languages !== undefined) updateData.languages = updates.languages;
    if (updates.customLanguages !== undefined) updateData.customLanguages = updates.customLanguages;

    // Ubicación
    if (updates.officeAddress !== undefined) updateData.officeAddress = updates.officeAddress;
    if (updates.officeCity !== undefined) updateData.officeCity = updates.officeCity;
    if (updates.officeState !== undefined) updateData.officeState = updates.officeState;
    if (updates.officeZipCode !== undefined) updateData.officeZipCode = updates.officeZipCode;
    if (updates.googlePlaceId !== undefined) updateData.googlePlaceId = updates.googlePlaceId;
    if (updates.coordinatesLat !== undefined) updateData.coordinatesLat = updates.coordinatesLat;
    if (updates.coordinatesLng !== undefined) updateData.coordinatesLng = updates.coordinatesLng;

    // Redes
    if (updates.linkedinUrl !== undefined) updateData.linkedinUrl = updates.linkedinUrl;
    if (updates.personalWebsite !== undefined) updateData.personalWebsite = updates.personalWebsite;

    updateData.updatedAt = new Date();

    // Validar email si se está actualizando
    if (updates.email) {
      const emailValidation = await validateEmailGlobal(updates.email);
      if (!emailValidation.available) {
        console.warn('Email already exists, but allowing update:', updates.email);
      }
    }

    await db
      .update(freelancersProfiles)
      .set(updateData)
      .where(eq(freelancersProfiles.id, parseInt(freelancerId)));

    // Registrar actividad
    await logActivity({
      userId: parseInt(updatedByUserId),
      teamId: null,
      action: 'UPDATE_FREELANCER_PROFILE',
      description: 'Updated freelancer profile',
      metadata: {
        freelancerId,
        updatedFields: Object.keys(updateData)
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating freelancer:', error);
    throw error;
  }
}

/**
 * Eliminar freelancer
 */
export async function deleteFreelancer(
  freelancerId: string,
  deletedByUserId: string
): Promise<{ success: boolean }> {
  try {
    const freelancer = await getFreelancerById(freelancerId);
    if (!freelancer) {
      throw new Error('Freelancer not found');
    }

    await db
      .delete(freelancersProfiles)
      .where(eq(freelancersProfiles.id, parseInt(freelancerId)));

    // Registrar actividad
    await logActivity({
      userId: parseInt(deletedByUserId),
      teamId: null,
      action: 'DELETE_FREELANCER_PROFILE',
      description: `Deleted freelancer profile: ${freelancer.fullName || freelancer.email}`,
      metadata: {
        freelancerId,
        deletedFreelancer: {
          name: freelancer.fullName,
          email: freelancer.email,
          professionalType: freelancer.professionalType
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting freelancer:', error);
    throw error;
  }
}

// ============================================
// FUNCIONES DE BÚSQUEDA PÚBLICA
// ============================================

export interface FreelancerSearchFilters {
  professionalType?: 'immigration_attorney' | 'form_preparer';
  specialties?: SpecialtyType[];
  languages?: LanguageType[];
  state?: string;
  city?: string;
  yearsExperience?: { min?: number; max?: number };
  search?: string; // Búsqueda por nombre o bio
}

/**
 * Búsqueda pública de freelancers
 */
export async function searchFreelancers(
  filters: FreelancerSearchFilters,
  limit = 20,
  offset = 0
): Promise<{
  freelancers: (FreelancerProfile & { user: { name: string | null } })[];
  total: number;
}> {
  try {
    let query = db
      .select({
        id: freelancersProfiles.id,
        userId: freelancersProfiles.userId,
        professionalType: freelancersProfiles.professionalType,
        fullName: freelancersProfiles.fullName,
        email: freelancersProfiles.email,
        phone: freelancersProfiles.phone,
        primaryState: freelancersProfiles.primaryState,
        primaryCity: freelancersProfiles.primaryCity,
        barNumber: freelancersProfiles.barNumber,
        primaryBarState: freelancersProfiles.primaryBarState,
        additionalBarStates: freelancersProfiles.additionalBarStates,
        specialties: freelancersProfiles.specialties,
        customSpecialties: freelancersProfiles.customSpecialties,
        businessLicenseNumber: freelancersProfiles.businessLicenseNumber,
        disclaimerAccepted: freelancersProfiles.disclaimerAccepted,
        disclaimerAcceptedAt: freelancersProfiles.disclaimerAcceptedAt,
        hasBusiness: freelancersProfiles.hasBusiness,
        businessName: freelancersProfiles.businessName,
        businessEntityType: freelancersProfiles.businessEntityType,
        businessWebsite: freelancersProfiles.businessWebsite,
        profilePhotoUrl: freelancersProfiles.profilePhotoUrl,
        bio: freelancersProfiles.bio,
        yearsExperience: freelancersProfiles.yearsExperience,
        languages: freelancersProfiles.languages,
        customLanguages: freelancersProfiles.customLanguages,
        officeAddress: freelancersProfiles.officeAddress,
        officeCity: freelancersProfiles.officeCity,
        officeState: freelancersProfiles.officeState,
        officeZipCode: freelancersProfiles.officeZipCode,
        googlePlaceId: freelancersProfiles.googlePlaceId,
        coordinatesLat: freelancersProfiles.coordinatesLat,
        coordinatesLng: freelancersProfiles.coordinatesLng,
        linkedinUrl: freelancersProfiles.linkedinUrl,
        personalWebsite: freelancersProfiles.personalWebsite,
        createdAt: freelancersProfiles.createdAt,
        updatedAt: freelancersProfiles.updatedAt,
        user: {
          name: users.name,
        },
      })
      .from(freelancersProfiles)
      .innerJoin(users, eq(freelancersProfiles.userId, users.id));

    const conditions: any[] = [];

    // Aplicar filtros
    if (filters.professionalType) {
      conditions.push(eq(freelancersProfiles.professionalType, filters.professionalType));
    }

    if (filters.state) {
      conditions.push(eq(freelancersProfiles.primaryState, filters.state));
    }

    if (filters.city) {
      conditions.push(ilike(freelancersProfiles.primaryCity, `%${filters.city}%`));
    }

    if (filters.specialties && filters.specialties.length > 0) {
      conditions.push(sql`${freelancersProfiles.specialties} && ${filters.specialties}`);
    }

    if (filters.languages && filters.languages.length > 0) {
      conditions.push(sql`${freelancersProfiles.languages} && ${filters.languages}`);
    }

    if (filters.yearsExperience?.min !== undefined) {
      conditions.push(sql`${freelancersProfiles.yearsExperience} >= ${filters.yearsExperience.min}`);
    }

    if (filters.yearsExperience?.max !== undefined) {
      conditions.push(sql`${freelancersProfiles.yearsExperience} <= ${filters.yearsExperience.max}`);
    }

    if (filters.search) {
      const searchTerm = `%${filters.search}%`;
      conditions.push(
        or(
          ilike(freelancersProfiles.fullName, searchTerm),
          ilike(freelancersProfiles.bio, searchTerm),
          ilike(users.name, searchTerm)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Obtener total para paginación
    const totalQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(freelancersProfiles)
      .innerJoin(users, eq(freelancersProfiles.userId, users.id));

    if (conditions.length > 0) {
      totalQuery.where(and(...conditions));
    }

    const [{ count: total }] = await totalQuery;

    // Obtener resultados con paginación
    const freelancers = await query
      .limit(limit)
      .offset(offset)
      .orderBy(freelancersProfiles.createdAt);

    return { freelancers, total };

  } catch (error) {
    console.error('Error searching freelancers:', error);
    return { freelancers: [], total: 0 };
  }
}

/**
 * Obtener freelancers por especialidad
 */
export async function getFreelancersBySpecialty(
  specialty: SpecialtyType,
  state?: string
): Promise<FreelancerProfile[]> {
  try {
    let query = db
      .select()
      .from(freelancersProfiles)
      .where(sql`${freelancersProfiles.specialties} @> ${[specialty]}`);

    if (state) {
      query = query.where(
        and(
          sql`${freelancersProfiles.specialties} @> ${[specialty]}`,
          eq(freelancersProfiles.primaryState, state)
        )
      );
    }

    return await query;
  } catch (error) {
    console.error('Error fetching freelancers by specialty:', error);
    return [];
  }
}

// ============================================
// FUNCIONES DE ESTADÍSTICAS
// ============================================

/**
 * Obtener estadísticas generales de freelancers
 */
export async function getFreelancerStats(): Promise<{
  totalFreelancers: number;
  byProfessionalType: Record<string, number>;
  attorneys: number;
  preparers: number;
  withBusiness: number;
}> {
  try {
    const stats = await db
      .select({
        total: sql<number>`count(*)`,
        professionalType: freelancersProfiles.professionalType,
        withBusiness: sql<number>`count(*) filter (where has_business = true)`,
      })
      .from(freelancersProfiles)
      .groupBy(freelancersProfiles.professionalType);

    const byProfessionalType: Record<string, number> = {};
    let totalFreelancers = 0;
    let attorneys = 0;
    let preparers = 0;
    let withBusiness = 0;

    for (const stat of stats) {
      byProfessionalType[stat.professionalType] = stat.total;
      totalFreelancers += stat.total;
      withBusiness += stat.withBusiness;

      if (stat.professionalType === 'immigration_attorney') {
        attorneys = stat.total;
      } else if (stat.professionalType === 'form_preparer') {
        preparers = stat.total;
      }
    }

    return {
      totalFreelancers,
      byProfessionalType,
      attorneys,
      preparers,
      withBusiness,
    };
  } catch (error) {
    console.error('Error fetching freelancer stats:', error);
    return {
      totalFreelancers: 0,
      byProfessionalType: {},
      attorneys: 0,
      preparers: 0,
      withBusiness: 0,
    };
  }
}