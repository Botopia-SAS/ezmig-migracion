import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/payments/stripe';
import { getProductTier, getPlanFeatures } from '@/lib/payments/plans';

function pickLatestPrice(prices: Stripe.Price[], productId?: string) {
  if (!productId) return null;
  const latest = prices
    .filter((price) => price.product === productId && price.active)
    .sort((a, b) => (b.created ?? 0) - (a.created ?? 0))[0];
  return latest || null;
}

export async function GET() {
  try {
    const [products, prices] = await Promise.all([
      stripe.products.list({ active: true }),
      stripe.prices.list({ active: true, type: 'recurring', limit: 100 }),
    ]);

    const starterProduct = products.data.find(
      (product) => getProductTier(product) === 'starter'
    );
    const professionalProduct = products.data.find(
      (product) => getProductTier(product) === 'professional'
    );

    const starterPrice = pickLatestPrice(prices.data, starterProduct?.id);
    const professionalPrice = pickLatestPrice(prices.data, professionalProduct?.id);

    const serialize = (price: Stripe.Price | null, product?: Stripe.Product) => {
      if (!price || !product) return null;
      const tier = getProductTier(product);
      return {
        productId: product.id,
        priceId: price.id,
        amount: price.unit_amount ?? 0,
        interval: price.recurring?.interval ?? 'month',
        currency: price.currency,
        trialDays: price.recurring?.trial_period_days ?? 0,
        productName: product.name,
        features: tier ? getPlanFeatures(tier, product.metadata) : [],
      };
    };

    const body = {
      base: serialize(starterPrice, starterProduct),
      plus: serialize(professionalPrice, professionalProduct),
    };

    return NextResponse.json(body, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error('Failed to load pricing from Stripe', error);
    return NextResponse.json({ error: 'Unable to fetch pricing' }, { status: 500 });
  }
}
