import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withOwner } from '@/lib/api/middleware';
import { successResponse, createdResponse, handleRouteError } from '@/lib/api/response';
import { validateBody } from '@/lib/api/validators';
import { createApiKey, listApiKeys, API_KEY_SCOPES, type ApiKeyScope } from '@/lib/auth/api-keys';
import { securityLog } from '@/lib/api/logger';
import { ActivityType } from '@/lib/db/schema';
import { logActivity } from '@/lib/activity/service';

const createApiKeySchema = z.object({
  name: z.string().min(1).max(100),
  scopes: z.array(z.enum(API_KEY_SCOPES as unknown as [string, ...string[]])).min(1),
  expiresAt: z.string().datetime().nullable().optional(),
});

// GET /api/api-keys - List all API keys for the team
export const GET = withOwner(async (_req, ctx) => {
  try {
    const keys = await listApiKeys(ctx.teamId);
    return successResponse(keys);
  } catch (error) {
    return handleRouteError(error, 'Failed to list API keys');
  }
});

// POST /api/api-keys - Create a new API key
export const POST = withOwner(async (req: NextRequest, ctx) => {
  try {
    const body = await req.json();
    const [data, error] = validateBody(createApiKeySchema, body);
    if (error) return error;

    const { key, record } = await createApiKey({
      teamId: ctx.teamId,
      userId: ctx.user.id,
      name: data.name,
      scopes: data.scopes as ApiKeyScope[],
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    });

    securityLog({
      level: 'info',
      event: 'api_key_created',
      userId: ctx.user.id,
      teamId: ctx.teamId,
      keyPrefix: record.keyPrefix,
    });

    await logActivity({
      teamId: ctx.teamId,
      userId: ctx.user.id,
      action: ActivityType.CREATE_API_KEY,
      entityType: 'team',
      entityId: ctx.teamId,
      entityName: data.name,
    });

    return createdResponse({
      key,
      id: record.id,
      name: record.name,
      keyPrefix: record.keyPrefix,
      scopes: record.scopes,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
    });
  } catch (error) {
    return handleRouteError(error, 'Failed to create API key');
  }
});
