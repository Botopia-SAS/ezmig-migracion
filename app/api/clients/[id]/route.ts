import { withAuth } from '@/lib/api/middleware';
import { successResponse, handleRouteError, notFoundResponse, conflictResponse } from '@/lib/api/response';
import { validateBody, requireIntParam } from '@/lib/api/validators';
import {
  getClientById,
  getClientWithCases,
  updateClient,
  deleteClient,
  clientEmailExists,
  type UpdateClientInput,
} from '@/lib/clients/service';
import { z } from 'zod';

const updateClientSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
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
  notes: z.string().optional().nullable(),
});

export const GET = withAuth(async (request, { teamId }, params) => {
  try {
    const [clientId, err] = requireIntParam(params?.id, 'client ID');
    if (err) return err;

    const { searchParams } = new URL(request.url);
    const includeCases = searchParams.get('includeCases') === 'true';

    const client = includeCases
      ? await getClientWithCases(clientId, teamId)
      : await getClientById(clientId, teamId);

    if (!client) return notFoundResponse('Client');

    return successResponse(client);
  } catch (error) {
    return handleRouteError(error, 'Failed to fetch client');
  }
});

export const PUT = withAuth(async (request, { user, teamId }, params) => {
  try {
    const [clientId, err] = requireIntParam(params?.id, 'client ID');
    if (err) return err;

    const body = await request.json();
    const [data, validationError] = validateBody(updateClientSchema, body);
    if (validationError) return validationError;

    if (data.email) {
      const emailExists = await clientEmailExists(teamId, data.email, clientId);
      if (emailExists) {
        return conflictResponse('A client with this email already exists');
      }
    }

    const updateData: UpdateClientInput = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        (updateData as Record<string, unknown>)[key] = value ?? undefined;
      }
    }

    const updatedClient = await updateClient(clientId, teamId, user.id, updateData);
    if (!updatedClient) return notFoundResponse('Client');

    return successResponse(updatedClient);
  } catch (error) {
    return handleRouteError(error, 'Failed to update client');
  }
});

export const DELETE = withAuth(async (_request, { user, teamId }, params) => {
  try {
    const [clientId, err] = requireIntParam(params?.id, 'client ID');
    if (err) return err;

    const deleted = await deleteClient(clientId, teamId, user.id);
    if (!deleted) return notFoundResponse('Client');

    return successResponse({ success: true });
  } catch (error) {
    return handleRouteError(error, 'Failed to delete client');
  }
});
