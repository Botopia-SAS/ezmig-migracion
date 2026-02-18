import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { registerAgency } from '@/lib/agencies/service';
import type { AgencyRegistrationData } from '@/lib/db/schema';
import { checkRateLimit, rateLimitResponse, getClientIp, RATE_LIMITS } from '@/lib/api/rate-limit';
import { securityLog } from '@/lib/api/logger';
import { handlePreflight, setCorsHeaders } from '@/lib/api/cors';

// Schema de validación para el registro de agencia
// Filosofía: PERMISIVO - solo agencyType es obligatorio, disclaimer solo para immigration_services
const registerAgencySchema = z.object({
  // ÚNICO CAMPO OBLIGATORIO
  agencyType: z.enum(['law_firm', 'immigration_services'], {
    required_error: 'Agency type is required',
    invalid_type_error: 'Agency type must be either law_firm or immigration_services'
  }),

  // Información empresa (todos opcionales)
  legalBusinessName: z.string().min(2).max(255).optional(),
  businessNameDba: z.string().min(2).max(255).optional(),
  businessEmail: z.string().email().max(255).optional(),
  businessPhone: z.string().max(20).optional(),
  website: z.string().max(500).optional(),

  // Dirección (todos opcionales)
  address: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zipCode: z.string().max(20).optional(),
  googlePlaceId: z.string().max(255).optional(),
  coordinatesLat: z.string().max(50).optional(),
  coordinatesLng: z.string().max(50).optional(),

  // Específicos por tipo (todos opcionales)
  firmRegistrationNumber: z.string().max(100).optional(),
  firmRegistrationState: z.string().max(50).optional(),
  businessLicenseNumber: z.string().max(100).optional(),
  disclaimerAccepted: z.boolean().optional(),

  // Contacto principal (todos opcionales)
  ownerFullName: z.string().min(3).max(255).optional(),
  ownerPosition: z.string().min(2).max(100).optional(),
  ownerEmail: z.string().email().max(255).optional(),
  ownerPhone: z.string().max(20).optional(),
}).refine(
  (data) => {
    // Validación específica: disclaimer obligatorio para immigration_services
    if (data.agencyType === 'immigration_services') {
      return data.disclaimerAccepted === true;
    }
    return true;
  },
  {
    message: 'You must accept the disclaimer to register immigration services',
    path: ['disclaimerAccepted']
  }
);

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = getClientIp(request.headers);
    const rl = checkRateLimit(RATE_LIMITS.auth, `ip:${ip}`);
    if (!rl.allowed) {
      securityLog({ level: 'warn', event: 'rate_limit_hit', ip, endpoint: '/api/agencies/register' });
      return rateLimitResponse(rl.retryAfterMs);
    }

    const body = await request.json();

    // Validar datos de entrada
    const validationResult = registerAgencySchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors;

      // Verificar si es error de disclaimer específicamente
      const disclaimerError = errors.find(err =>
        err.path.includes('disclaimerAccepted') ||
        err.message.includes('disclaimer')
      );

      if (disclaimerError) {
        return NextResponse.json(
          {
            success: false,
            error: 'DISCLAIMER_REQUIRED',
            message: 'You must accept the disclaimer'
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'VALIDATION_ERROR',
          message: 'Invalid data provided',
          details: errors
        },
        { status: 400 }
      );
    }

    // Registrar agencia
    const agencyData: AgencyRegistrationData = validationResult.data;
    const result = await registerAgency(agencyData);

    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error('Error registering agency:', error);

    // Manejar errores específicos
    if (error instanceof Error) {
      if (error.message.startsWith('DISCLAIMER_REQUIRED')) {
        return NextResponse.json(
          {
            success: false,
            error: 'DISCLAIMER_REQUIRED',
            message: 'You must accept the disclaimer'
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to register agency'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(req: NextRequest) {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;
  return new NextResponse(null, { status: 200 });
}