import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserWithTeam } from '@/lib/auth/rbac';
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
  maxUses: z.number().min(1).max(100).optional(),
  allowedForms: z.array(z.number()).nullable().optional(),
  allowedSections: z.array(z.string()).nullable().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/referrals/[id]
 * Get a specific referral link by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const linkId = parseInt(id, 10);

    if (isNaN(linkId)) {
      return NextResponse.json({ error: 'Invalid link ID' }, { status: 400 });
    }

    const userWithTeam = await getUserWithTeam();

    if (!userWithTeam?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userWithTeam.team) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    const link = await getReferralLinkById(linkId, userWithTeam.team.id);

    if (!link) {
      return NextResponse.json({ error: 'Referral link not found' }, { status: 404 });
    }

    // Get usage history
    const usage = await getReferralLinkUsage(linkId, userWithTeam.team.id);

    // Generate full URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = getReferralLinkUrl(link.code, baseUrl);

    return NextResponse.json({
      link: { ...link, url },
      usage,
    });
  } catch (error) {
    console.error('Error fetching referral link:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral link' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/referrals/[id]
 * Update a referral link
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const linkId = parseInt(id, 10);

    if (isNaN(linkId)) {
      return NextResponse.json({ error: 'Invalid link ID' }, { status: 400 });
    }

    const userWithTeam = await getUserWithTeam();

    if (!userWithTeam?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userWithTeam.team) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    // Only owners can update referral links
    if (userWithTeam.tenantRole !== 'owner') {
      return NextResponse.json(
        { error: 'Only team owners can update referral links' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateReferralLinkSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    const updates: Parameters<typeof updateReferralLink>[2] = {};
    if (data.isActive !== undefined) updates.isActive = data.isActive;
    if (data.expiresAt !== undefined) {
      updates.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    }
    if (data.maxUses !== undefined) updates.maxUses = data.maxUses;
    if (data.allowedForms !== undefined) updates.allowedForms = data.allowedForms;
    if (data.allowedSections !== undefined) updates.allowedSections = data.allowedSections;

    const updatedLink = await updateReferralLink(
      linkId,
      userWithTeam.team.id,
      updates
    );

    if (!updatedLink) {
      return NextResponse.json({ error: 'Referral link not found' }, { status: 404 });
    }

    // Generate full URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const url = getReferralLinkUrl(updatedLink.code, baseUrl);

    return NextResponse.json({ link: { ...updatedLink, url } });
  } catch (error) {
    console.error('Error updating referral link:', error);
    return NextResponse.json(
      { error: 'Failed to update referral link' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/referrals/[id]
 * Delete a referral link
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const linkId = parseInt(id, 10);

    if (isNaN(linkId)) {
      return NextResponse.json({ error: 'Invalid link ID' }, { status: 400 });
    }

    const userWithTeam = await getUserWithTeam();

    if (!userWithTeam?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!userWithTeam.team) {
      return NextResponse.json({ error: 'No team found' }, { status: 404 });
    }

    // Only owners can delete referral links
    if (userWithTeam.tenantRole !== 'owner') {
      return NextResponse.json(
        { error: 'Only team owners can delete referral links' },
        { status: 403 }
      );
    }

    const deleted = await deleteReferralLink(linkId, userWithTeam.team.id);

    if (!deleted) {
      return NextResponse.json({ error: 'Referral link not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting referral link:', error);
    return NextResponse.json(
      { error: 'Failed to delete referral link' },
      { status: 500 }
    );
  }
}
