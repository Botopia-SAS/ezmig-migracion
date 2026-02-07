import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  createFreelancer,
  searchFreelancers,
  getFreelancerById
} from '@/lib/freelancers/service';
import type { FreelancerRegistrationData, FreelancerSearchFilters } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const freelancerId = searchParams.get('id');

    // Si se solicita un freelancer específico
    if (freelancerId) {
      const freelancer = await getFreelancerById(freelancerId);
      if (!freelancer) {
        return Response.json({ error: 'Freelancer not found' }, { status: 404 });
      }

      return Response.json({
        success: true,
        data: freelancer
      });
    }

    // Búsqueda pública de freelancers
    const filters: FreelancerSearchFilters = {};

    // Filtros de búsqueda
    if (searchParams.get('professionalType')) {
      filters.professionalType = searchParams.get('professionalType') as 'immigration_attorney' | 'form_preparer';
    }
    if (searchParams.get('state')) {
      filters.state = searchParams.get('state')!;
    }
    if (searchParams.get('city')) {
      filters.city = searchParams.get('city')!;
    }
    if (searchParams.get('specialties')) {
      filters.specialties = searchParams.get('specialties')!.split(',');
    }
    if (searchParams.get('languages')) {
      filters.languages = searchParams.get('languages')!.split(',');
    }
    if (searchParams.get('query')) {
      filters.searchTerm = searchParams.get('query')!;
    }

    // Paginación
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    const results = await searchFreelancers(filters, { limit, offset });

    return Response.json({
      success: true,
      data: results.freelancers,
      pagination: {
        total: results.total,
        limit,
        offset,
        hasMore: results.total > offset + limit
      }
    });

  } catch (error) {
    console.error('GET freelancers error:', error);
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

    // Validar datos requeridos
    if (!body.professionalType || !body.email) {
      return Response.json({
        error: 'Missing required fields: professionalType, email'
      }, { status: 400 });
    }

    // Preparar datos de registro
    const registrationData: FreelancerRegistrationData = {
      professionalType: body.professionalType,
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      primaryState: body.primaryState,
      primaryCity: body.primaryCity,
      barNumber: body.barNumber,
      primaryBarState: body.primaryBarState,
      additionalBarStates: body.additionalBarStates,
      specialties: body.specialties,
      customSpecialties: body.customSpecialties,
      businessLicenseNumber: body.businessLicenseNumber,
      disclaimerAccepted: body.disclaimerAccepted,
      hasBusiness: body.hasBusiness,
      businessName: body.businessName,
      businessEntityType: body.businessEntityType,
      businessWebsite: body.businessWebsite,
      profilePhotoUrl: body.profilePhotoUrl,
      bio: body.bio,
      yearsExperience: body.yearsExperience,
      languages: body.languages,
      customLanguages: body.customLanguages,
      officeAddress: body.officeAddress,
      officeCity: body.officeCity,
      officeState: body.officeState,
      officeZipCode: body.officeZipCode,
      googlePlaceId: body.googlePlaceId,
      coordinatesLat: body.coordinatesLat,
      coordinatesLng: body.coordinatesLng,
      linkedinUrl: body.linkedinUrl,
      personalWebsite: body.personalWebsite
    };

    const result = await createFreelancer(registrationData, session.user.id.toString());

    return Response.json({
      success: true,
      data: result
    }, { status: 201 });

  } catch (error) {
    console.error('POST freelancers error:', error);
    return Response.json(
      {
        error: 'Failed to create freelancer profile',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}