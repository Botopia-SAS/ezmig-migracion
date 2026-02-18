/**
 * Setup Stripe Subscription Plans
 *
 * Creates "Starter" and "Professional" products with monthly recurring prices.
 * Idempotent: skips existing products by name.
 *
 * Usage: npx tsx scripts/setup-stripe-plans.ts
 */

import Stripe from 'stripe';
import 'dotenv/config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const PLANS = [
  {
    name: 'Starter',
    description: 'For small practices getting started with immigration case management.',
    priceInCents: 2900, // $29/mo
    features: [
      'Up to 25 active cases',
      '3 team members',
      'AI assistant',
      'Email support',
    ],
  },
  {
    name: 'Professional',
    description: 'For growing firms that need unlimited capacity and premium features.',
    priceInCents: 7900, // $79/mo
    features: [
      'Unlimited active cases',
      'Unlimited team members',
      'Priority support',
      'Custom branding',
    ],
  },
];

async function main() {
  console.log('Setting up Stripe subscription plans...\n');

  // Fetch existing products to check for duplicates
  const existing = await stripe.products.list({ active: true, limit: 100 });
  const existingByName = new Map(existing.data.map((p) => [p.name, p]));

  for (const plan of PLANS) {
    const existingProduct = existingByName.get(plan.name);

    if (existingProduct) {
      // Check if it already has an active recurring price
      const prices = await stripe.prices.list({
        product: existingProduct.id,
        active: true,
        type: 'recurring',
      });

      if (prices.data.length > 0) {
        console.log(`✓ "${plan.name}" already exists (product: ${existingProduct.id}, price: ${prices.data[0].id})`);
        continue;
      }

      // Product exists but no active recurring price — create one
      const price = await stripe.prices.create({
        product: existingProduct.id,
        unit_amount: plan.priceInCents,
        currency: 'usd',
        recurring: { interval: 'month' },
      });

      console.log(`✓ Created price for existing "${plan.name}" (product: ${existingProduct.id}, price: ${price.id})`);
      continue;
    }

    // Create product + price
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: {
        features: JSON.stringify(plan.features),
      },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.priceInCents,
      currency: 'usd',
      recurring: { interval: 'month' },
    });

    // Set default price
    await stripe.products.update(product.id, {
      default_price: price.id,
    });

    console.log(`✓ Created "${plan.name}" (product: ${product.id}, price: ${price.id})`);
  }

  console.log('\nDone! Subscription plans are ready in Stripe.');
}

main().catch((err) => {
  console.error('Error setting up plans:', err);
  process.exit(1);
});
