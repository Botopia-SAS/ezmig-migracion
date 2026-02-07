import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/api/middleware';
import { successResponse, createdResponse, handleRouteError } from '@/lib/api/response';
import { validateBody } from '@/lib/api/validators';
import { ActivityType } from '@/lib/db/schema';
import { logActivity } from '@/lib/activity/service';
import {
  createReferralLink,
  getReferralLinksByTeam,
  getReferralLinkUrl,
} from '@/lib/referrals/service';

// Schema for creating a referral link
const createReferralLinkSchema = z.object({
  caseId: z.number().optional(),
  formTypeIds: z.array(z.number()).min(1, 'At least one form type is required'),
  expiresAt: z.string().datetime().optional(),
  maxUses: z.number().min(1).max(100).optional(),
  allowedSections: z.array(z.string()).optional(),
});

/**
 * GET /api/referrals
 * List all referral links for the current team
 */
export const GET = withAuth(async (_req, ctx) => {
  try {
    const links = await getReferralLinksByTeam(ctx.teamId);

    // Generate full URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const linksWithUrls = links.map((link) => ({
      ...link,
      url: getReferralLinkUrl(link.code, baseUrl),
    }));

    return successResponse({ links: linksWithUrls });
  } catch (error) {
    return handleRouteError(error, 'Error fetching referral links');
  }
});

/**
 * POST /api/referrals
 * Create a new referral link
 */
export const POST = withAuth(async (req: NextRequest, ctx) => {
  try {
    const body = await req.json();
    const [data, validationErr] = validateBody(createReferralLinkSchema, body);
    if (validationErr) return validationErr;

    // Create the referral link
    const link = await createReferralLink({
      teamId: ctx.teamId,
      caseId: data.caseId,
      formTypeIds: data.formTypeIds,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      maxUses: data.maxUses,
      allowedSections: data.allowedSections,
      createdBy: ctx.user.id,
    });

    // Log activity
    await logActivity({
      teamId: ctx.teamId,
      userId: ctx.user.id,
      action: ActivityType.CREATE_REFERRAL_LINK,
      entityType: 'referral',
      entityId: link.id,
      entityName: link.code,
    });

    // Generate full URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = getReferralLinkUrl(link.code, baseUrl);

    return createdResponse({ link: { ...link, url } });
  } catch (error) {
    return handleRouteError(error, 'Error creating referral link');
  }
});
