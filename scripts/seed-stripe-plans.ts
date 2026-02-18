/**
 * Seed Stripe with subscription plans for EZMig.
 * Run: npx tsx scripts/seed-stripe-plans.ts
 */
import Stripe from 'stripe';
import 'dotenv/config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil' as Stripe.LatestApiVersion,
});

const PLANS = [
  {
    name: 'Starter',
    description: 'For solo practitioners getting started with immigration case management.',
    priceMonthly: 4900, // $49/mo
    metadata: {
      plan_tier: 'starter',
      features: JSON.stringify([
        'Up to 25 active cases',
        '3 team members',
        'AI form assistant',
        'Email support',
        'Client portal',
        'Autosave & progress tracking',
      ]),
    },
  },
  {
    name: 'Professional',
    description: 'For growing firms that need unlimited capacity and premium features.',
    priceMonthly: 9900, // $99/mo
    metadata: {
      plan_tier: 'professional',
      features: JSON.stringify([
        'Unlimited active cases',
        'Unlimited team members',
        'Priority support',
        'Custom branding',
        'Advanced analytics',
        'PDF generation & e-filing',
        'Referral program',
        'API access',
      ]),
    },
  },
];

async function seed() {
  console.log('Seeding Stripe plans...\n');

  for (const plan of PLANS) {
    // Check if product already exists
    const existing = await stripe.products.list({ limit: 100 });
    const found = existing.data.find(
      (p) => p.name === plan.name && p.active
    );

    if (found) {
      console.log(`Product "${plan.name}" already exists (${found.id}), skipping.`);
      // Check if it has an active recurring price
      const prices = await stripe.prices.list({
        product: found.id,
        active: true,
        type: 'recurring',
      });
      if (prices.data.length > 0) {
        console.log(`  Price: ${prices.data[0].id} ($${(prices.data[0].unit_amount! / 100).toFixed(2)}/${prices.data[0].recurring?.interval})\n`);
      }
      continue;
    }

    // Create product
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: plan.metadata,
    });
    console.log(`Created product: ${product.name} (${product.id})`);

    // Create monthly price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.priceMonthly,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { plan_tier: plan.metadata.plan_tier },
    });
    console.log(`  Price: ${price.id} ($${(plan.priceMonthly / 100).toFixed(2)}/month)`);

    // Set as default price
    await stripe.products.update(product.id, {
      default_price: price.id,
    });
    console.log(`  Set as default price\n`);
  }

  console.log('Done! Plans are now available in Stripe.');
}

seed().catch(console.error);
