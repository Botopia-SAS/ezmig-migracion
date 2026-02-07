import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/db/queries';
import { db } from '@/lib/db/drizzle';
import { teamMembers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { User } from '@/lib/db/schema';
import { unauthorizedResponse, forbiddenResponse } from './response';

export type TenantRole = 'owner' | 'staff' | 'client';

export interface AuthContext {
  user: User;
  teamId: number;
  tenantRole: TenantRole;
}

type RouteHandler = (
  req: NextRequest,
  ctx: AuthContext,
  params?: Record<string, string>
) => Promise<NextResponse>;

/**
 * Wraps an API route handler with authentication and team membership checks.
 * Resolves user, team membership, and tenant role before calling the handler.
 */
export function withAuth(handler: RouteHandler) {
  return async (req: NextRequest, routeCtx?: { params?: Promise<Record<string, string>> }) => {
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
    const user = await getUser();
    if (!user) {
      return unauthorizedResponse();
    }
    const params = routeCtx?.params ? await routeCtx.params : undefined;
    return handler(req, user, params);
  };
}
