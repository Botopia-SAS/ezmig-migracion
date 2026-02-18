import { NextRequest, NextResponse } from 'next/server';
import { getUser, getUserById } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { teamMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { User } from '@/lib/db/schema';
import { unauthorizedResponse, forbiddenResponse } from './response';
import { verifyApiKey, hasScope, type ApiKeyScope } from '@/lib/auth/api-keys';
import { checkRateLimit, rateLimitResponse, getClientIp, type RateLimitConfig } from './rate-limit';
import { securityLog } from './logger';

export type TenantRole = 'owner' | 'staff' | 'client';

export type AuthMethod = 'session' | 'api_key';

export interface AuthContext {
  user: User;
  teamId: number;
  tenantRole: TenantRole;
  authMethod: AuthMethod;
  apiKeyScopes?: string[];
}

type RouteHandler = (
  req: NextRequest,
  ctx: AuthContext,
  params?: Record<string, string>
) => Promise<NextResponse>;

/**
 * Attempt to resolve user from Bearer token Authorization header.
 * Returns null if no Bearer header or invalid key.
 */
async function resolveFromBearer(req: NextRequest): Promise<{
  user: User;
  teamId: number;
  tenantRole: TenantRole;
  scopes: string[];
} | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ezm_live_')) return null;

  const plainKey = authHeader.slice(7);
  const keyData = await verifyApiKey(plainKey);
  if (!keyData) {
    securityLog({
      level: 'warn',
      event: 'auth_failure',
      ip: getClientIp(req.headers),
      reason: 'invalid_api_key',
    });
    return null;
  }

  const user = await getUserById(keyData.userId);
  if (!user) return null;

  const [membership] = await db
    .select({
      teamId: teamMembers.teamId,
      role: teamMembers.role,
    })
    .from(teamMembers)
    .where(eq(teamMembers.userId, user.id))
    .limit(1);

  if (!membership) return null;

  // Ensure API key's teamId matches user's membership
  if (membership.teamId !== keyData.teamId) return null;

  return {
    user,
    teamId: membership.teamId,
    tenantRole: membership.role as TenantRole,
    scopes: keyData.scopes,
  };
}

/**
 * Wraps an API route handler with authentication and team membership checks.
 * Supports both Bearer token and cookie session authentication.
 * Bearer token is checked first; falls back to cookie session.
 */
export function withAuth(handler: RouteHandler) {
  return async (req: NextRequest, routeCtx?: { params?: Promise<Record<string, string>> }) => {
    // Try Bearer token first
    const bearerResult = await resolveFromBearer(req);
    if (bearerResult) {
      const params = routeCtx?.params ? await routeCtx.params : undefined;
      return handler(req, {
        user: bearerResult.user,
        teamId: bearerResult.teamId,
        tenantRole: bearerResult.tenantRole,
        authMethod: 'api_key',
        apiKeyScopes: bearerResult.scopes,
      }, params);
    }

    // Fall back to cookie session
    const user = await getUser();
    if (!user) {
      return unauthorizedResponse();
    }

    const [membership] = await db
      .select({
        teamId: teamMembers.teamId,
        role: teamMembers.role,
      })
      .from(teamMembers)
      .where(eq(teamMembers.userId, user.id))
      .limit(1);

    if (!membership) {
      return forbiddenResponse('No team membership found');
    }

    const params = routeCtx?.params ? await routeCtx.params : undefined;

    return handler(req, {
      user,
      teamId: membership.teamId,
      tenantRole: membership.role as TenantRole,
      authMethod: 'session',
    }, params);
  };
}

/**
 * Requires the user to be a team owner.
 */
export function withOwner(handler: RouteHandler) {
  return withAuth(async (req, ctx, params) => {
    if (ctx.tenantRole !== 'owner') {
      return forbiddenResponse('Only team owners can perform this action');
    }
    return handler(req, ctx, params);
  });
}

/**
 * Requires the user to be a team owner or staff.
 */
export function withStaffOrOwner(handler: RouteHandler) {
  return withAuth(async (req, ctx, params) => {
    if (ctx.tenantRole === 'client') {
      return forbiddenResponse('Clients cannot perform this action');
    }
    return handler(req, ctx, params);
  });
}

/**
 * Requires the user to be a global admin.
 */
export function withAdmin(handler: (req: NextRequest, user: User, params?: Record<string, string>) => Promise<NextResponse>) {
  return async (req: NextRequest, routeCtx?: { params?: Promise<Record<string, string>> }) => {
    // Try Bearer token first
    const bearerResult = await resolveFromBearer(req as NextRequest);
    if (bearerResult) {
      if (bearerResult.user.role !== 'admin') {
        return forbiddenResponse('Admin access required');
      }
      const params = routeCtx?.params ? await routeCtx.params : undefined;
      return handler(req, bearerResult.user, params);
    }

    const user = await getUser();
    if (!user) {
      return unauthorizedResponse();
    }
    if (user.role !== 'admin') {
      return forbiddenResponse('Admin access required');
    }
    const params = routeCtx?.params ? await routeCtx.params : undefined;
    return handler(req, user, params);
  };
}

/**
 * Only checks authentication, no team membership required.
 * Useful for routes like notifications that only need userId.
 */
export function withUser(handler: (req: NextRequest, user: User, params?: Record<string, string>) => Promise<NextResponse>) {
  return async (req: NextRequest, routeCtx?: { params?: Promise<Record<string, string>> }) => {
    // Try Bearer token first
    const bearerResult = await resolveFromBearer(req as NextRequest);
    if (bearerResult) {
      const params = routeCtx?.params ? await routeCtx.params : undefined;
      return handler(req, bearerResult.user, params);
    }

    const user = await getUser();
    if (!user) {
      return unauthorizedResponse();
    }
    const params = routeCtx?.params ? await routeCtx.params : undefined;
    return handler(req, user, params);
  };
}

/**
 * Require specific API key scope. Only applies to Bearer auth;
 * session-based auth passes through without scope restriction.
 */
export function withScope(scope: ApiKeyScope, handler: RouteHandler) {
  return withAuth(async (req, ctx, params) => {
    if (ctx.authMethod === 'api_key' && ctx.apiKeyScopes) {
      if (!hasScope(ctx.apiKeyScopes, scope)) {
        return forbiddenResponse(`API key missing required scope: ${scope}`);
      }
    }
    return handler(req, ctx, params);
  });
}

/**
 * Wrap an authenticated handler with rate limiting.
 * Uses user ID for session auth, API key ID for Bearer auth, or IP as fallback.
 */
export function withRateLimit(config: RateLimitConfig, handler: RouteHandler) {
  return withAuth(async (req, ctx, params) => {
    const identifier =
      ctx.authMethod === 'api_key'
        ? `apikey:${ctx.user.id}`
        : `user:${ctx.user.id}`;

    const result = checkRateLimit(config, identifier);
    if (!result.allowed) {
      securityLog({
        level: 'warn',
        event: 'rate_limit_hit',
        userId: ctx.user.id,
        ip: getClientIp(req.headers),
        endpoint: req.nextUrl.pathname,
        tier: config.name,
      });
      return rateLimitResponse(result.retryAfterMs);
    }
    return handler(req, ctx, params);
  });
}
