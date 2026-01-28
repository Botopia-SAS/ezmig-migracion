import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/payments/stripe';

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

    const baseProduct = products.data.find(
      (product) => product.name.toLowerCase() === 'base'
    );
    const plusProduct = products.data.find(
      (product) => product.name.toLowerCase() === 'plus'
    );

    const basePrice = pickLatestPrice(prices.data, baseProduct?.id);
    const plusPrice = pickLatestPrice(prices.data, plusProduct?.id);

    const serialize = (price: Stripe.Price | null, product?: Stripe.Product) => {
      if (!price || !product) return null;
      return {
        productId: product.id,
        priceId: price.id,
        amount: price.unit_amount ?? 0,
        interval: price.recurring?.interval ?? 'month',
        currency: price.currency,
        trialDays: price.recurring?.trial_period_days ?? 0,
        productName: product.name,
      };
    };

    const body = {
      base: serialize(basePrice, baseProduct),
      plus: serialize(plusPrice, plusProduct),
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
