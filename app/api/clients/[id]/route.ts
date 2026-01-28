import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { teamMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  getClientById,
  getClientWithCases,
  updateClient,
  deleteClient,
  clientEmailExists,
  type UpdateClientInput,
} from '@/lib/clients/service';
import { z } from 'zod';

// Validation schema for updating a client
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

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/clients/[id]
 * Get a specific client by ID with their cases
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const clientId = parseInt(id);

    if (isNaN(clientId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's team
    const [membership] = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, user.id))
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: 'No team membership found' }, { status: 403 });
    }

    // Check if we want cases included
    const { searchParams } = new URL(request.url);
    const includeCases = searchParams.get('includeCases') === 'true';

    let client;
    if (includeCases) {
      client = await getClientWithCases(clientId, membership.teamId);
    } else {
      client = await getClientById(clientId, membership.teamId);
    }

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { error: 'Failed to fetch client' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/clients/[id]
 * Update a client
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const clientId = parseInt(id);

    if (isNaN(clientId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's team
    const [membership] = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, user.id))
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: 'No team membership found' }, { status: 403 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateClientSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // If email is being updated, check for duplicates
    if (data.email) {
      const emailExists = await clientEmailExists(
        membership.teamId,
        data.email,
        clientId
      );
      if (emailExists) {
        return NextResponse.json(
          { error: 'A client with this email already exists' },
          { status: 409 }
        );
      }
    }

    // Build update object, converting undefined to optional fields
    const updateData: UpdateClientInput = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone ?? undefined;
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth ?? undefined;
    if (data.countryOfBirth !== undefined) updateData.countryOfBirth = data.countryOfBirth ?? undefined;
    if (data.nationality !== undefined) updateData.nationality = data.nationality ?? undefined;
    if (data.alienNumber !== undefined) updateData.alienNumber = data.alienNumber ?? undefined;
    if (data.uscisOnlineAccount !== undefined) updateData.uscisOnlineAccount = data.uscisOnlineAccount ?? undefined;
    if (data.currentStatus !== undefined) updateData.currentStatus = data.currentStatus ?? undefined;
    if (data.addressLine1 !== undefined) updateData.addressLine1 = data.addressLine1 ?? undefined;
    if (data.addressLine2 !== undefined) updateData.addressLine2 = data.addressLine2 ?? undefined;
    if (data.city !== undefined) updateData.city = data.city ?? undefined;
    if (data.state !== undefined) updateData.state = data.state ?? undefined;
    if (data.zipCode !== undefined) updateData.zipCode = data.zipCode ?? undefined;
    if (data.country !== undefined) updateData.country = data.country ?? undefined;
    if (data.notes !== undefined) updateData.notes = data.notes ?? undefined;

    // Update the client
    const updatedClient = await updateClient(
      clientId,
      membership.teamId,
      user.id,
      updateData
    );

    if (!updatedClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/clients/[id]
 * Soft delete a client
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const clientId = parseInt(id);

    if (isNaN(clientId)) {
      return NextResponse.json({ error: 'Invalid client ID' }, { status: 400 });
    }

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's team
    const [membership] = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, user.id))
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: 'No team membership found' }, { status: 403 });
    }

    // Delete the client
    const deleted = await deleteClient(
      clientId,
      membership.teamId,
      user.id
    );

    if (!deleted) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }
}
