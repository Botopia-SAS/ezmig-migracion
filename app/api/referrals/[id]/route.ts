import { NextRequest } from 'next/server';
import { z } from 'zod';
import { withAuth, withOwner } from '@/lib/api/middleware';
import { successResponse, notFoundResponse, handleRouteError } from '@/lib/api/response';
import { requireIntParam, validateBody } from '@/lib/api/validators';
import {
  getReferralLinkById,
  updateReferralLink,
  deleteReferralLink,
  getReferralLinkUsage,
  getReferralLinkUrl,
} from '@/lib/referrals/service';

// Schema for updating a referral link
const updateReferralLinkSchema = z.object({
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  maxUses: z.number().min(1).nullable().optional(),
  formTypeIds: z.array(z.number()).min(1).optional(),
  allowedSections: z.array(z.string()).nullable().optional(),
});

/**
 * GET /api/referrals/[id]
 * Get a specific referral link by ID
 */
export const GET = withAuth(async (_req, ctx, params) => {
  try {
    const [linkId, err] = requireIntParam(params?.id, 'link ID');
    if (err) return err;

    const link = await getReferralLinkById(linkId, ctx.teamId);

    if (!link) {
      return notFoundResponse('Referral link');
    }

    // Get usage history
    const usage = await getReferralLinkUsage(linkId, ctx.teamId);

    // Generate full URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = getReferralLinkUrl(link.code, baseUrl);

    return successResponse({
      link: { ...link, url },
      usage,
    });
  } catch (error) {
    return handleRouteError(error, 'Error fetching referral link');
  }
});

/**
 * PUT /api/referrals/[id]
 * Update a referral link (owner only)
 */
export const PUT = withOwner(async (req: NextRequest, ctx, params) => {
  try {
    const [linkId, err] = requireIntParam(params?.id, 'link ID');
    if (err) return err;

    const body = await req.json();
    const [data, validationErr] = validateBody(updateReferralLinkSchema, body);
    if (validationErr) return validationErr;

    const updates: Parameters<typeof updateReferralLink>[2] = {};
    if (data.isActive !== undefined) updates.isActive = data.isActive;
    if (data.expiresAt !== undefined) {
      updates.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    }
    if (data.maxUses !== undefined) updates.maxUses = data.maxUses;
    if (data.formTypeIds !== undefined) updates.formTypeIds = data.formTypeIds;
    if (data.allowedSections !== undefined) updates.allowedSections = data.allowedSections;

    const updatedLink = await updateReferralLink(
      linkId,
      ctx.teamId,
      updates
    );

    if (!updatedLink) {
      return notFoundResponse('Referral link');
    }

    // Generate full URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = getReferralLinkUrl(updatedLink.code, baseUrl);

    return successResponse({ link: { ...updatedLink, url } });
  } catch (error) {
    return handleRouteError(error, 'Error updating referral link');
  }
});

/**
 * DELETE /api/referrals/[id]
 * Delete a referral link (owner only)
 */
export const DELETE = withOwner(async (_req, ctx, params) => {
  try {
    const [linkId, err] = requireIntParam(params?.id, 'link ID');
    if (err) return err;

    const deleted = await deleteReferralLink(linkId, ctx.teamId);

    if (!deleted) {
      return notFoundResponse('Referral link');
    }

    return successResponse({ success: true });
  } catch (error) {
    return handleRouteError(error, 'Error deleting referral link');
  }
});
