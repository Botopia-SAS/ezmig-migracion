/**
 * Shared utility for mapping Stripe products to plan tiers.
 * Used by both /api/pricing (landing) and /api/billing/plans (dashboard).
 */

export type PlanTier = 'starter' | 'professional';

const DEFAULT_FEATURES: Record<PlanTier, string[]> = {
  starter: [
    'Up to 25 active cases',
    '3 team members',
    'AI assistant',
    'Email support',
  ],
  professional: [
    'Unlimited active cases',
    'Unlimited team members',
    'Priority support',
    'Custom branding',
  ],
};

/**
 * Determine the plan tier from a Stripe product's metadata or name.
 * Checks metadata.plan_tier first, then falls back to name matching.
 */
export function getProductTier(product: {
  name: string;
  metadata?: Record<string, string>;
}): PlanTier | null {
  // 1. Check metadata first
  const metaTier = product.metadata?.plan_tier?.toLowerCase();
  if (metaTier === 'starter' || metaTier === 'professional') {
    return metaTier;
  }

  // 2. Fallback to name matching
  const name = product.name.toLowerCase();
  if (name === 'base' || name === 'starter') return 'starter';
  if (name === 'plus' || name === 'professional') return 'professional';

  return null;
}

/**
 * Get features for a plan tier.
 * Reads from Stripe product metadata.features (JSON string array) first,
 * falls back to hardcoded defaults.
 */
export function getPlanFeatures(
  tier: PlanTier,
  metadata?: Record<string, string>
): string[] {
  if (metadata?.features) {
    try {
      const parsed = JSON.parse(metadata.features);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    } catch {
      // Fall through to defaults
    }
  }
  return DEFAULT_FEATURES[tier];
}
