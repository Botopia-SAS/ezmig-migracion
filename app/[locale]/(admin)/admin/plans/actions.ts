'use server';

import { stripe } from '@/lib/payments/stripe';

/**
 * Update the price of a Stripe product by archiving the old price and creating a new one.
 */
export async function updatePlanPrice(productId: string, newAmountCents: number) {
  // Get current active prices for this product
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    type: 'recurring',
  });

  // Create new price
  const newPrice = await stripe.prices.create({
    product: productId,
    unit_amount: newAmountCents,
    currency: 'usd',
    recurring: { interval: 'month' },
  });

  // Set as default price on the product
  await stripe.products.update(productId, {
    default_price: newPrice.id,
  });

  // Archive old prices
  for (const oldPrice of prices.data) {
    if (oldPrice.id !== newPrice.id) {
      await stripe.prices.update(oldPrice.id, { active: false });
    }
  }

  return { priceId: newPrice.id };
}

/**
 * Update the features metadata on a Stripe product.
 */
export async function updatePlanFeatures(productId: string, features: string[]) {
  await stripe.products.update(productId, {
    metadata: { features: JSON.stringify(features) },
  });
}
