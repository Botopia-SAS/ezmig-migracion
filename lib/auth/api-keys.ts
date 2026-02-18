import crypto from 'node:crypto';
import { hash, compare } from 'bcryptjs';
import { db } from '@/lib/db/drizzle';
import { apiKeys } from '@/lib/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

// Valid scopes for API keys
export const API_KEY_SCOPES = [
  'cases:read',
  'cases:write',
  'clients:read',
  'clients:write',
  'forms:read',
  'forms:write',
  'evidences:read',
  'evidences:write',
  'referrals:read',
  'referrals:write',
] as const;

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

const KEY_PREFIX = 'ezm_live_';
const KEY_RANDOM_LENGTH = 48;
const SALT_ROUNDS = 10;

/**
 * Generate a new API key. Returns the plain-text key (shown once to user).
 * Only the bcrypt hash is stored in the database.
 */
export async function createApiKey(params: {
  teamId: number;
  userId: number;
  name: string;
  scopes: ApiKeyScope[];
  expiresAt?: Date | null;
}): Promise<{ key: string; record: typeof apiKeys.$inferSelect }> {
  const randomBytes = crypto.randomBytes(KEY_RANDOM_LENGTH);
  const randomPart = randomBytes.toString('base64url');
  const plainKey = `${KEY_PREFIX}${randomPart}`;

  const keyHash = await hash(plainKey, SALT_ROUNDS);
  const keyPrefix = plainKey.substring(0, 12);

  const [record] = await db
    .insert(apiKeys)
    .values({
      teamId: params.teamId,
      userId: params.userId,
      name: params.name,
      keyHash,
      keyPrefix,
      scopes: params.scopes,
      expiresAt: params.expiresAt ?? null,
    })
    .returning();

  return { key: plainKey, record };
}

/**
 * Verify an API key and return associated metadata.
 * Returns null if key is invalid, expired, or revoked.
 */
export async function verifyApiKey(
  plainKey: string
): Promise<{
  id: number;
  teamId: number;
  userId: number;
  scopes: string[];
} | null> {
  if (!plainKey.startsWith(KEY_PREFIX)) return null;

  const prefix = plainKey.substring(0, 12);

  // Find candidate keys by prefix (narrows bcrypt comparison)
  const candidates = await db
    .select()
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.keyPrefix, prefix),
        eq(apiKeys.isActive, true),
        isNull(apiKeys.revokedAt)
      )
    );

  for (const candidate of candidates) {
    // Check expiration first (cheap)
    if (candidate.expiresAt && new Date(candidate.expiresAt) < new Date()) {
      continue;
    }

    // bcrypt comparison (expensive, but narrowed by prefix)
    const matches = await compare(plainKey, candidate.keyHash);
    if (matches) {
      // Update lastUsedAt (fire-and-forget)
      db.update(apiKeys)
        .set({ lastUsedAt: new Date() })
        .where(eq(apiKeys.id, candidate.id))
        .then(() => {})
        .catch(() => {});

      return {
        id: candidate.id,
        teamId: candidate.teamId,
        userId: candidate.userId,
        scopes: candidate.scopes as string[],
      };
    }
  }

  return null;
}

/**
 * Check if an API key has the required scope.
 * `:write` implies `:read` for the same resource.
 */
export function hasScope(keyScopes: string[], requiredScope: string): boolean {
  const [resource, action] = requiredScope.split(':');
  if (action === 'read') {
    return (
      keyScopes.includes(requiredScope) ||
      keyScopes.includes(`${resource}:write`)
    );
  }
  return keyScopes.includes(requiredScope);
}

/**
 * List API keys for a team (never returns the hash).
 */
export async function listApiKeys(teamId: number) {
  return db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      scopes: apiKeys.scopes,
      expiresAt: apiKeys.expiresAt,
      lastUsedAt: apiKeys.lastUsedAt,
      isActive: apiKeys.isActive,
      createdAt: apiKeys.createdAt,
      revokedAt: apiKeys.revokedAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.teamId, teamId))
    .orderBy(apiKeys.createdAt);
}

/**
 * Revoke an API key (soft delete).
 */
export async function revokeApiKey(keyId: number, teamId: number) {
  const [revoked] = await db
    .update(apiKeys)
    .set({ isActive: false, revokedAt: new Date() })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.teamId, teamId)))
    .returning();

  return revoked ?? null;
}

/**
 * Rotate: revoke old key, create new one with same scopes/name.
 */
export async function rotateApiKey(
  keyId: number,
  teamId: number,
  userId: number
) {
  // Find the existing key
  const [existing] = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.teamId, teamId)))
    .limit(1);

  if (!existing) return null;

  // Revoke the old key
  await revokeApiKey(keyId, teamId);

  // Create new key with same scopes and name
  return createApiKey({
    teamId,
    userId,
    name: existing.name,
    scopes: existing.scopes as ApiKeyScope[],
    expiresAt: existing.expiresAt,
  });
}
