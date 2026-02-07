import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/middleware';
import { getAgencyById, updateAgencySettings } from '@/lib/agencies/service';
import { validateAgencyPermission } from '@/lib/agencies/permissions';
import type { AgencyRegistrationData } from '@/lib/db/schema';

// Schema para actualizaciones de configuración
const updateSettingsSchema = z.object({
  // Información básica (editables por owner/staff)
  legalBusinessName: z.string().min(2).max(255).optional(),
  businessNameDba: z.string().min(2).max(255).optional(),
  businessEmail: z.string().email().max(255).optional(),
  businessPhone: z.string().max(20).optional(),
  website: z.string().max(500).optional(),

  // Dirección (editables por owner/staff)
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zipCode: z.string().max(20).optional(),
  googlePlaceId: z.string().max(255).optional(),
  coordinatesLat: z.string().max(50).optional(),
  coordinatesLng: z.string().max(50).optional(),

  // Campos de owner (solo owner)
  firmRegistrationNumber: z.string().max(100).optional(),
  firmRegistrationState: z.string().max(50).optional(),
  businessLicenseNumber: z.string().max(100).optional(),
  ownerFullName: z.string().min(3).max(255).optional(),
  ownerPosition: z.string().min(2).max(100).optional(),
  ownerEmail: z.string().email().max(255).optional(),
  ownerPhone: z.string().max(20).optional(),
});

// GET: Obtener configuraciones actuales de la agencia
export const GET = withAuth(async (request, { user, teamId, tenantRole }) => {
  try {
    if (!teamId) {
      return NextResponse.json(
        { error: 'No agency associated with user' },
        { status: 400 }
      );
    }

    const agency = await getAgencyById(teamId);
    if (!agency) {
      return NextResponse.json(
        { error: 'Agency not found' },
        { status: 404 }
      );
    }

    // Filtrar campos según permisos del usuario
    // TODO: Implementar filtrado basado en permisos
    // Por ahora devolver todos los campos para MVP

    const response = {
      agencyType: agency.agencyType,
      agencyStatus: agency.agencyStatus,
      completionPercentage: agency.completionPercentage,

      // Información básica
      legalBusinessName: agency.legalBusinessName,
      businessNameDba: agency.businessNameDba,
      businessEmail: agency.businessEmail,
      businessPhone: agency.businessPhone,
      website: agency.website,

      // Dirección
      address: agency.address,
      city: agency.city,
      state: agency.state,
      zipCode: agency.zipCode,
      country: agency.country,

      // Google Maps
      googlePlaceId: agency.googlePlaceId,
      coordinatesLat: agency.coordinatesLat,
      coordinatesLng: agency.coordinatesLng,

      // Información legal
      firmRegistrationNumber: agency.firmRegistrationNumber,
      firmRegistrationState: agency.firmRegistrationState,
      businessLicenseNumber: agency.businessLicenseNumber,
      disclaimerAccepted: agency.disclaimerAccepted,
      disclaimerAcceptedAt: agency.disclaimerAcceptedAt,

      // Información del owner
      ownerFullName: agency.ownerFullName,
      ownerPosition: agency.ownerPosition,
      ownerEmail: agency.ownerEmail,
      ownerPhone: agency.ownerPhone,

      // Metadata
      createdAt: agency.createdAt,
      updatedAt: agency.updatedAt,
    };

    return NextResponse.json({
      success: true,
      agency: response
    });

  } catch (error) {
    console.error('Error fetching agency settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agency settings' },
      { status: 500 }
    );
  }
});

// PUT: Actualizar configuraciones de la agencia
export const PUT = withAuth(async (request, { user, teamId, tenantRole }) => {
  try {
    if (!teamId) {
      return NextResponse.json(
        { error: 'No agency associated with user' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Validar datos de entrada
    const validationResult = updateSettingsSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Invalid data provided',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    // TODO: Validar permisos para cada campo
    // Por ahora permitir todas las actualizaciones para MVP
    // const teamMember = await getTeamMemberByUserAndTeam(user.id, teamId);
    // for (const field of Object.keys(validationResult.data)) {
    //   const permission = validateAgencyPermission(user, teamMember, field, false);
    //   if (!permission.allowed) {
    //     return NextResponse.json(
    //       { error: 'PERMISSION_DENIED', field, reason: permission.reason },
    //       { status: 403 }
    //     );
    //   }
    // }

    // Actualizar configuraciones
    const updates: Partial<AgencyRegistrationData> = validationResult.data;
    const result = await updateAgencySettings(teamId, updates, user.id);

    return NextResponse.json({
      success: true,
      message: 'Agency settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating agency settings:', error);
    return NextResponse.json(
      { error: 'Failed to update agency settings' },
      { status: 500 }
    );
  }
});