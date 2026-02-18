import { withAuth } from '@/lib/api/middleware';
import { successResponse, notFoundResponse, handleRouteError } from '@/lib/api/response';
import { validateBody } from '@/lib/api/validators';
import { getClientByUserId, updateClient } from '@/lib/clients/service';
import { z } from 'zod';

const updateClientProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  countryOfBirth: z.string().max(100).optional().nullable(),
  nationality: z.string().max(100).optional().nullable(),
  alienNumber: z.string().max(20).optional().nullable(),
  uscisOnlineAccount: z.string().max(100).optional().nullable(),
  currentStatus: z.string().max(50).optional().nullable(),
  addressLine1: z.string().max(255).optional().nullable(),
  addressLine2: z.string().max(255).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(50).optional().nullable(),
  zipCode: z.string().max(20).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
});

export const GET = withAuth(async (_request, { user, teamId }) => {
  try {
    const client = await getClientByUserId(user.id, teamId);
    if (!client) {
      return notFoundResponse('Client profile');
    }
    return successResponse(client);
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch client profile');
  }
});

export const PUT = withAuth(async (request, { user, teamId }) => {
  try {
    const client = await getClientByUserId(user.id, teamId);
    if (!client) {
      return notFoundResponse('Client profile');
    }

    const body = await request.json();
    const [data, validationError] = validateBody(updateClientProfileSchema, body);
    if (validationError) return validationError;

    const updatedClient = await updateClient(client.id, teamId, user.id, data);
    if (!updatedClient) return notFoundResponse('Client profile');

    return successResponse(updatedClient);
  } catch (error) {
    return handleRouteError(error, 'Failed to update client profile');
  }
});
