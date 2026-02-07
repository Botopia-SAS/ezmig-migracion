import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  getFreelancerById,
  updateFreelancer,
  deleteFreelancer
} from '@/lib/freelancers/service';
import type { FreelancerRegistrationData } from '@/lib/db/schema';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const freelancer = await getFreelancerById(params.id);
    if (!freelancer) {
      return Response.json({ error: 'Freelancer not found' }, { status: 404 });
    }

    // Datos públicos - no requiere autenticación
    return Response.json({
      success: true,
      data: freelancer
    });

  } catch (error) {
    console.error('GET freelancer error:', error);
    return Response.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Obtener el freelancer existente
    const existingFreelancer = await getFreelancerById(params.id);
    if (!existingFreelancer) {
      return Response.json({ error: 'Freelancer not found' }, { status: 404 });
    }

    // Verificar que el usuario sea el propietario del perfil
    if (existingFreelancer.userId !== session.user.id) {
      return Response.json({
        error: 'Access denied. You can only edit your own profile.'
      }, { status: 403 });
    }

    // Preparar datos de actualización
    const updateData: Partial<FreelancerRegistrationData> = {};

    if (body.professionalType !== undefined) updateData.professionalType = body.professionalType;
    if (body.fullName !== undefined) updateData.fullName = body.fullName;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.primaryState !== undefined) updateData.primaryState = body.primaryState;
    if (body.primaryCity !== undefined) updateData.primaryCity = body.primaryCity;
    if (body.barNumber !== undefined) updateData.barNumber = body.barNumber;
    if (body.primaryBarState !== undefined) updateData.primaryBarState = body.primaryBarState;
    if (body.additionalBarStates !== undefined) updateData.additionalBarStates = body.additionalBarStates;
    if (body.specialties !== undefined) updateData.specialties = body.specialties;
    if (body.customSpecialties !== undefined) updateData.customSpecialties = body.customSpecialties;
    if (body.businessLicenseNumber !== undefined) updateData.businessLicenseNumber = body.businessLicenseNumber;
    if (body.disclaimerAccepted !== undefined) updateData.disclaimerAccepted = body.disclaimerAccepted;
    if (body.hasBusiness !== undefined) updateData.hasBusiness = body.hasBusiness;
    if (body.businessName !== undefined) updateData.businessName = body.businessName;
    if (body.businessEntityType !== undefined) updateData.businessEntityType = body.businessEntityType;
    if (body.businessWebsite !== undefined) updateData.businessWebsite = body.businessWebsite;
    if (body.profilePhotoUrl !== undefined) updateData.profilePhotoUrl = body.profilePhotoUrl;
    if (body.bio !== undefined) updateData.bio = body.bio;
    if (body.yearsExperience !== undefined) updateData.yearsExperience = body.yearsExperience;
    if (body.languages !== undefined) updateData.languages = body.languages;
    if (body.customLanguages !== undefined) updateData.customLanguages = body.customLanguages;
    if (body.officeAddress !== undefined) updateData.officeAddress = body.officeAddress;
    if (body.officeCity !== undefined) updateData.officeCity = body.officeCity;
    if (body.officeState !== undefined) updateData.officeState = body.officeState;
    if (body.officeZipCode !== undefined) updateData.officeZipCode = body.officeZipCode;
    if (body.googlePlaceId !== undefined) updateData.googlePlaceId = body.googlePlaceId;
    if (body.coordinatesLat !== undefined) updateData.coordinatesLat = body.coordinatesLat;
    if (body.coordinatesLng !== undefined) updateData.coordinatesLng = body.coordinatesLng;
    if (body.linkedinUrl !== undefined) updateData.linkedinUrl = body.linkedinUrl;
    if (body.personalWebsite !== undefined) updateData.personalWebsite = body.personalWebsite;

    const result = await updateFreelancer(
      params.id,
      updateData,
      session.user.id.toString()
    );

    return Response.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('PUT freelancer error:', error);
    return Response.json(
      {
        error: 'Failed to update freelancer profile',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Obtener el freelancer existente
    const existingFreelancer = await getFreelancerById(params.id);
    if (!existingFreelancer) {
      return Response.json({ error: 'Freelancer not found' }, { status: 404 });
    }

    // Verificar que el usuario sea el propietario del perfil
    if (existingFreelancer.userId !== session.user.id) {
      return Response.json({
        error: 'Access denied. You can only delete your own profile.'
      }, { status: 403 });
    }

    const result = await deleteFreelancer(params.id, session.user.id.toString());

    return Response.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('DELETE freelancer error:', error);
    return Response.json(
      {
        error: 'Failed to delete freelancer profile',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}