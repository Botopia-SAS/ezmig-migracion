import { withAuth } from '@/lib/api/middleware';
import { successResponse, createdResponse, handleRouteError, conflictResponse } from '@/lib/api/response';
import { validateBody } from '@/lib/api/validators';
import {
  createClient,
  getClientsForTeam,
  searchClients,
  clientEmailExists,
} from '@/lib/clients/service';
import { z } from 'zod';

const createClientSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(20).optional(),
  dateOfBirth: z.string().optional(),
  countryOfBirth: z.string().max(100).optional(),
  nationality: z.string().max(100).optional(),
  alienNumber: z.string().max(20).optional(),
  uscisOnlineAccount: z.string().max(100).optional(),
  currentStatus: z.string().max(50).optional(),
  addressLine1: z.string().max(255).optional(),
  addressLine2: z.string().max(255).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  zipCode: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  notes: z.string().optional(),
});

export const GET = withAuth(async (request, { teamId }) => {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (search && search.length >= 2 && searchParams.get('quick') === 'true') {
      const results = await searchClients(teamId, search, 10);
      return successResponse({ clients: results });
    }

    const result = await getClientsForTeam(teamId, {
      search,
      status,
      limit,
      offset,
    });

    return successResponse(result);
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch clients');
  }
});

export const POST = withAuth(async (request, { user, teamId }) => {
  try {
    const body = await request.json();
    const [data, validationError] = validateBody(createClientSchema, body);
    if (validationError) return validationError;

    const emailExists = await clientEmailExists(teamId, data.email);
    if (emailExists) {
      return conflictResponse('A client with this email already exists');
    }

    const newClient = await createClient({
      teamId,
      createdBy: user.id,
      ...data,
    });

    return createdResponse(newClient);
  } catch (error) {
    return handleRouteError(error, 'Failed to create client');
  }
});
