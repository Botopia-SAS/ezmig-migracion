import { db } from '@/lib/db/drizzle';
import { clients, cases, ActivityType } from '@/lib/db/schema';
import { eq, and, desc, isNull, or, ilike, sql } from 'drizzle-orm';
import type { Client, Case } from '@/lib/db/schema';
import { logActivity, detectChanges } from '@/lib/activity';

// ============================================
// TYPES
// ============================================

export interface CreateClientInput {
  teamId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  countryOfBirth?: string;
  nationality?: string;
  alienNumber?: string;
  uscisOnlineAccount?: string;
  currentStatus?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  notes?: string;
  createdBy: number;
}

export interface UpdateClientInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  countryOfBirth?: string;
  nationality?: string;
  alienNumber?: string;
  uscisOnlineAccount?: string;
  currentStatus?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  notes?: string;
}

export interface ClientWithCases extends Client {
  cases: Case[];
  _count: {
    cases: number;
  };
}

export interface ClientListFilters {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Create a new client for a team
 */
export async function createClient(input: CreateClientInput): Promise<Client> {
  const [newClient] = await db
    .insert(clients)
    .values({
      teamId: input.teamId,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      dateOfBirth: input.dateOfBirth,
      countryOfBirth: input.countryOfBirth,
      nationality: input.nationality,
      alienNumber: input.alienNumber,
      uscisOnlineAccount: input.uscisOnlineAccount,
      currentStatus: input.currentStatus,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      city: input.city,
      state: input.state,
      zipCode: input.zipCode,
      country: input.country || 'USA',
      notes: input.notes,
      createdBy: input.createdBy,
    })
    .returning();

  // Log activity
  await logClientActivity(input.teamId, input.createdBy, ActivityType.CREATE_CLIENT, newClient);

  return newClient;
}

/**
 * Get a client by ID (with team verification)
 */
export async function getClientById(
  clientId: number,
  teamId: number
): Promise<Client | null> {
  const [client] = await db
    .select()
    .from(clients)
    .where(
      and(
        eq(clients.id, clientId),
        eq(clients.teamId, teamId),
        isNull(clients.deletedAt)
      )
    )
    .limit(1);

  return client || null;
}

/**
 * Get a client with their cases
 */
export async function getClientWithCases(
  clientId: number,
  teamId: number
): Promise<ClientWithCases | null> {
  const client = await getClientById(clientId, teamId);

  if (!client) return null;

  const clientCases = await db
    .select()
    .from(cases)
    .where(
      and(
        eq(cases.clientId, clientId),
        isNull(cases.deletedAt)
      )
    )
    .orderBy(desc(cases.createdAt));

  return {
    ...client,
    cases: clientCases,
    _count: {
      cases: clientCases.length,
    },
  };
}

/**
 * Get all clients for a team with filters
 */
export async function getClientsForTeam(
  teamId: number,
  filters: ClientListFilters = {}
): Promise<{ clients: Client[]; total: number }> {
  const { search, status, limit = 50, offset = 0 } = filters;

  // Build where conditions
  const conditions = [
    eq(clients.teamId, teamId),
    isNull(clients.deletedAt),
  ];

  if (search) {
    conditions.push(
      or(
        ilike(clients.firstName, `%${search}%`),
        ilike(clients.lastName, `%${search}%`),
        ilike(clients.email, `%${search}%`),
        ilike(clients.alienNumber, `%${search}%`)
      )!
    );
  }

  if (status) {
    conditions.push(eq(clients.currentStatus, status));
  }

  // Get clients with pagination
  const clientList = await db
    .select()
    .from(clients)
    .where(and(...conditions))
    .orderBy(desc(clients.createdAt))
    .limit(limit)
    .offset(offset);

  // Get total count
  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(clients)
    .where(and(...conditions));

  return {
    clients: clientList,
    total: Number(countResult?.count || 0),
  };
}

/**
 * Update a client
 */
export async function updateClient(
  clientId: number,
  teamId: number,
  userId: number,
  input: UpdateClientInput
): Promise<Client | null> {
  // Fetch old client first for change detection
  const oldClient = await getClientById(clientId, teamId);
  if (!oldClient) return null;

  const [updatedClient] = await db
    .update(clients)
    .set({
      ...input,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(clients.id, clientId),
        eq(clients.teamId, teamId),
        isNull(clients.deletedAt)
      )
    )
    .returning();

  if (updatedClient) {
    // Detect what changed
    const changes = detectChanges(oldClient, input, [
      'firstName', 'lastName', 'email', 'phone', 'dateOfBirth',
      'countryOfBirth', 'nationality', 'alienNumber', 'uscisOnlineAccount',
      'currentStatus', 'addressLine1', 'addressLine2', 'city', 'state',
      'zipCode', 'country', 'notes'
    ]);
    await logClientActivity(teamId, userId, ActivityType.UPDATE_CLIENT, updatedClient, changes);
  }

  return updatedClient || null;
}

/**
 * Soft delete a client
 */
export async function deleteClient(
  clientId: number,
  teamId: number,
  userId: number
): Promise<boolean> {
  const [deletedClient] = await db
    .update(clients)
    .set({
      deletedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(clients.id, clientId),
        eq(clients.teamId, teamId),
        isNull(clients.deletedAt)
      )
    )
    .returning();

  if (deletedClient) {
    await logClientActivity(teamId, userId, ActivityType.DELETE_CLIENT, deletedClient);
    return true;
  }

  return false;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if a client email already exists for a team
 */
export async function clientEmailExists(
  teamId: number,
  email: string,
  excludeId?: number
): Promise<boolean> {
  const conditions = [
    eq(clients.teamId, teamId),
    eq(clients.email, email),
    isNull(clients.deletedAt),
  ];

  if (excludeId) {
    conditions.push(sql`${clients.id} != ${excludeId}`);
  }

  const [existing] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(...conditions))
    .limit(1);

  return !!existing;
}

/**
 * Get client statistics for a team
 */
export async function getClientStats(teamId: number) {
  const [stats] = await db
    .select({
      total: sql<number>`count(*)`,
      withCases: sql<number>`count(distinct case when exists (
        select 1 from cases where cases.client_id = clients.id and cases.deleted_at is null
      ) then clients.id end)`,
    })
    .from(clients)
    .where(and(eq(clients.teamId, teamId), isNull(clients.deletedAt)));

  // Get status breakdown
  const statusBreakdown = await db
    .select({
      status: clients.currentStatus,
      count: sql<number>`count(*)`,
    })
    .from(clients)
    .where(and(eq(clients.teamId, teamId), isNull(clients.deletedAt)))
    .groupBy(clients.currentStatus);

  return {
    total: Number(stats?.total || 0),
    withCases: Number(stats?.withCases || 0),
    statusBreakdown: statusBreakdown.map((s) => ({
      status: s.status || 'Unknown',
      count: Number(s.count),
    })),
  };
}

/**
 * Search clients by name or email
 */
export async function searchClients(
  teamId: number,
  query: string,
  limit = 10
): Promise<Pick<Client, 'id' | 'firstName' | 'lastName' | 'email'>[]> {
  return db
    .select({
      id: clients.id,
      firstName: clients.firstName,
      lastName: clients.lastName,
      email: clients.email,
    })
    .from(clients)
    .where(
      and(
        eq(clients.teamId, teamId),
        isNull(clients.deletedAt),
        or(
          ilike(clients.firstName, `%${query}%`),
          ilike(clients.lastName, `%${query}%`),
          ilike(clients.email, `%${query}%`)
        )
      )
    )
    .orderBy(clients.lastName, clients.firstName)
    .limit(limit);
}

/**
 * Log client-related activity with entity context
 */
async function logClientActivity(
  teamId: number,
  userId: number,
  action: ActivityType,
  client: Client,
  changes?: Record<string, { old: unknown; new: unknown }> | null
) {
  await logActivity({
    teamId,
    userId,
    action,
    entityType: 'client',
    entityId: client.id,
    entityName: `${client.firstName} ${client.lastName}`,
    changes: changes || undefined,
  });
}

/**
 * Link a client to a user account (for portal access)
 */
export async function linkClientToUser(
  clientId: number,
  teamId: number,
  userId: number
): Promise<Client | null> {
  const [updatedClient] = await db
    .update(clients)
    .set({
      userId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(clients.id, clientId),
        eq(clients.teamId, teamId),
        isNull(clients.deletedAt)
      )
    )
    .returning();

  return updatedClient || null;
}
