import { NextRequest } from 'next/server';
import { searchFreelancers } from '@/lib/freelancers/service';
import type { FreelancerSearchFilters } from '@/lib/db/schema';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Construir filtros de búsqueda
    const filters: FreelancerSearchFilters = {};

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
      filters.specialties = searchParams.get('specialties')!.split(',').filter(s => s.trim());
    }

    if (searchParams.get('languages')) {
      filters.languages = searchParams.get('languages')!.split(',').filter(l => l.trim());
    }

    if (searchParams.get('query') || searchParams.get('q')) {
      filters.searchTerm = (searchParams.get('query') || searchParams.get('q'))!;
    }

    if (searchParams.get('hasBar')) {
      filters.hasBarNumber = searchParams.get('hasBar') === 'true';
    }

    if (searchParams.get('hasBusinessLicense')) {
      filters.hasBusinessLicense = searchParams.get('hasBusinessLicense') === 'true';
    }

    if (searchParams.get('minExperience')) {
      filters.minYearsExperience = parseInt(searchParams.get('minExperience')!);
    }

    // Parámetros de paginación
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Máximo 100
    const offset = parseInt(searchParams.get('offset') || '0');

    // Ordenamiento
    const sortBy = searchParams.get('sortBy') || 'newest';
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc';

    const results = await searchFreelancers(filters, {
      limit,
      offset,
      sortBy: sortBy as 'newest' | 'oldest' | 'experience' | 'name',
      sortOrder
    });

    return Response.json({
      success: true,
      data: results.freelancers,
      pagination: {
        total: results.total,
        limit,
        offset,
        hasMore: results.total > offset + limit,
        totalPages: Math.ceil(results.total / limit),
        currentPage: Math.floor(offset / limit) + 1
      },
      filters: filters // Devolver filtros aplicados para debugging
    });

  } catch (error) {
    console.error('GET freelancers search error:', error);
    return Response.json(
      {
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST para búsquedas más complejas con cuerpo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const filters: FreelancerSearchFilters = {
      professionalType: body.professionalType,
      state: body.state,
      city: body.city,
      specialties: body.specialties,
      languages: body.languages,
      searchTerm: body.searchTerm || body.query,
      hasBarNumber: body.hasBarNumber,
      hasBusinessLicense: body.hasBusinessLicense,
      minYearsExperience: body.minYearsExperience
    };

    const pagination = {
      limit: Math.min(body.limit || 20, 100),
      offset: body.offset || 0,
      sortBy: body.sortBy || 'newest',
      sortOrder: body.sortOrder || 'asc'
    };

    const results = await searchFreelancers(filters, pagination);

    return Response.json({
      success: true,
      data: results.freelancers,
      pagination: {
        total: results.total,
        limit: pagination.limit,
        offset: pagination.offset,
        hasMore: results.total > pagination.offset + pagination.limit,
        totalPages: Math.ceil(results.total / pagination.limit),
        currentPage: Math.floor(pagination.offset / pagination.limit) + 1
      },
      filters: filters
    });

  } catch (error) {
    console.error('POST freelancers search error:', error);
    return Response.json(
      {
        error: 'Search failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}