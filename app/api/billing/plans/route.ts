import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/middleware';
import { getStripePrices, getStripeProducts, stripe } from '@/lib/payments/stripe';
import { getProductTier, getPlanFeatures } from '@/lib/payments/plans';
import { db } from '@/lib/db/drizzle';
import { teams } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET = withAuth(async (_req: NextRequest, ctx) => {
  const [team] = await db
    .select({
      planName: teams.planName,
      subscriptionStatus: teams.subscriptionStatus,
    })
    .from(teams)
    .where(eq(teams.id, ctx.teamId))
    .limit(1);

  const [products, prices] = await Promise.all([
    getStripeProducts(),
    getStripePrices(),
  ]);

  // Also fetch full products to get metadata
  const fullProducts = await stripe.products.list({ active: true });
  const metadataMap = new Map(
    fullProducts.data.map((p) => [p.id, p.metadata])
  );

  const plans = products
    .filter((p) => {
      const tier = getProductTier({ name: p.name, metadata: metadataMap.get(p.id) });
      return tier !== null;
    })
    .map((product) => {
      const tier = getProductTier({ name: product.name, metadata: metadataMap.get(product.id) })!;
      const latestPrice = prices
        .filter((price) => price.productId === product.id)
        .sort((a, b) => (b.created ?? 0) - (a.created ?? 0))[0];

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        priceId: latestPrice?.id,
        price: latestPrice?.unitAmount ?? 0,
        interval: latestPrice?.interval ?? 'month',
        features: getPlanFeatures(tier, metadataMap.get(product.id)),
        tier,
      };
    })
    .sort((a, b) => a.price - b.price);

  return NextResponse.json({
    plans,
    currentPlan: team?.planName || null,
    subscriptionStatus: team?.subscriptionStatus || null,
  });
});
