import Stripe from 'stripe';
import { redirect } from 'next/navigation';
import { Team } from '@/lib/db/schema';
import {
  getTeamByStripeCustomerId,
  getUser,
  updateTeamSubscription,
  updateTeamStripeCustomerId,
} from '@/lib/db/queries';
import { getPackageById, purchaseTokens } from '@/lib/tokens/service';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil'
});

export async function createCheckoutSession({
  team,
  priceId
}: {
  team: Team | null;
  priceId: string;
}) {
  const user = await getUser();

  if (!team || !user) {
    redirect(`/sign-up?redirect=checkout&priceId=${priceId}`);
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    mode: 'subscription',
    success_url: `${process.env.BASE_URL}/api/stripe/checkout?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}/pricing`,
    customer: team.stripeCustomerId || undefined,
    client_reference_id: user.id.toString(),
    allow_promotion_codes: true,
    subscription_data: {
      trial_period_days: 14
    }
  });

  redirect(session.url!);
}

export async function createCustomerPortalSession(team: Team) {
  if (!team.stripeCustomerId || !team.stripeProductId) {
    redirect('/pricing');
  }

  let configuration: Stripe.BillingPortal.Configuration;
  const configurations = await stripe.billingPortal.configurations.list();

  if (configurations.data.length > 0) {
    configuration = configurations.data[0];
  } else {
    const product = await stripe.products.retrieve(team.stripeProductId);
    if (!product.active) {
      throw new Error("Team's product is not active in Stripe");
    }

    const prices = await stripe.prices.list({
      product: product.id,
      active: true
    });
    if (prices.data.length === 0) {
      throw new Error("No active prices found for the team's product");
    }

    configuration = await stripe.billingPortal.configurations.create({
      business_profile: {
        headline: 'Manage your subscription'
      },
      features: {
        subscription_update: {
          enabled: true,
          default_allowed_updates: ['price', 'quantity', 'promotion_code'],
          proration_behavior: 'create_prorations',
          products: [
            {
              product: product.id,
              prices: prices.data.map((price) => price.id)
            }
          ]
        },
        subscription_cancel: {
          enabled: true,
          mode: 'at_period_end',
          cancellation_reason: {
            enabled: true,
            options: [
              'too_expensive',
              'missing_features',
              'switched_service',
              'unused',
              'other'
            ]
          }
        },
        payment_method_update: {
          enabled: true
        }
      }
    });
  }

  return stripe.billingPortal.sessions.create({
    customer: team.stripeCustomerId,
    return_url: `${process.env.BASE_URL}/dashboard`,
    configuration: configuration.id
  });
}

export async function handleSubscriptionChange(
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status;

  const team = await getTeamByStripeCustomerId(customerId);

  if (!team) {
    console.error('Team not found for Stripe customer:', customerId);
    return;
  }

  if (status === 'active' || status === 'trialing') {
    const plan = subscription.items.data[0]?.plan;
    await updateTeamSubscription(team.id, {
      stripeSubscriptionId: subscriptionId,
      stripeProductId: plan?.product as string,
      planName: (plan?.product as Stripe.Product).name,
      subscriptionStatus: status
    });
  } else if (status === 'canceled' || status === 'unpaid') {
    await updateTeamSubscription(team.id, {
      stripeSubscriptionId: null,
      stripeProductId: null,
      planName: null,
      subscriptionStatus: status
    });
  }
}

export async function getStripePrices() {
  const prices = await stripe.prices.list({
    expand: ['data.product'],
    active: true,
    type: 'recurring'
  });

  return prices.data.map((price) => ({
    id: price.id,
    productId:
      typeof price.product === 'string' ? price.product : price.product.id,
    unitAmount: price.unit_amount,
    currency: price.currency,
    interval: price.recurring?.interval,
    trialPeriodDays: price.recurring?.trial_period_days,
    created: price.created
  }));
}

export async function getStripeProducts() {
  const products = await stripe.products.list({
    active: true,
    expand: ['data.default_price']
  });

  return products.data.map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    defaultPriceId:
      typeof product.default_price === 'string'
        ? product.default_price
        : product.default_price?.id
  }));
}

// ============================================
// TOKEN PURCHASE (ONE-TIME PAYMENT)
// ============================================

/**
 * Create a checkout session for purchasing tokens
 */
export async function createTokenCheckoutSession({
  team,
  packageId,
  userId,
}: {
  team: Team;
  packageId: number;
  userId: number;
}) {
  const pkg = await getPackageById(packageId);
  if (!pkg) {
    throw new Error(`Package with ID ${packageId} not found`);
  }

  // Create or get Stripe customer
  let customerId = team.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: {
        teamId: team.id.toString(),
      },
    });
    customerId = customer.id;
    await updateTeamStripeCustomerId(team.id, customerId);
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: pkg.stripePriceId,
        quantity: 1,
      },
    ],
    mode: 'payment', // One-time payment, not subscription
    success_url: `${process.env.BASE_URL}/api/stripe/token-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.BASE_URL}/dashboard/billing`,
    customer: customerId,
    client_reference_id: userId.toString(),
    metadata: {
      teamId: team.id.toString(),
      packageId: packageId.toString(),
      tokenAmount: pkg.tokens.toString(),
      type: 'token_purchase',
    },
    // Save payment method for future auto-reload
    payment_intent_data: {
      setup_future_usage: 'off_session',
      metadata: {
        teamId: team.id.toString(),
        packageId: packageId.toString(),
        tokenAmount: pkg.tokens.toString(),
      },
    },
  });

  return session;
}

/**
 * Handle successful token purchase from webhook or redirect
 */
export async function handleTokenPurchaseSuccess(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    throw new Error('Payment not completed');
  }

  const { teamId, packageId } = session.metadata || {};
  if (!teamId || !packageId) {
    throw new Error('Missing metadata in session');
  }

  const paymentIntentId = session.payment_intent as string;

  // Credit tokens to the team
  const transaction = await purchaseTokens({
    teamId: parseInt(teamId),
    packageId: parseInt(packageId),
    stripePaymentIntentId: paymentIntentId,
    userId: session.client_reference_id ? parseInt(session.client_reference_id) : undefined,
  });

  return transaction;
}

/**
 * Execute auto-reload for a team
 */
export async function executeAutoReload({
  teamId,
  customerId,
  packageId,
}: {
  teamId: number;
  customerId: string;
  packageId: number;
}) {
  const pkg = await getPackageById(packageId);
  if (!pkg) {
    throw new Error(`Package with ID ${packageId} not found`);
  }

  // Get customer's default payment method
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
  const paymentMethodId = customer.invoice_settings?.default_payment_method as string;

  if (!paymentMethodId) {
    console.log(`Team ${teamId} has no default payment method for auto-reload`);
    return null;
  }

  // Create and confirm PaymentIntent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: pkg.priceInCents,
    currency: 'usd',
    customer: customerId,
    payment_method: paymentMethodId,
    off_session: true,
    confirm: true,
    metadata: {
      teamId: teamId.toString(),
      packageId: packageId.toString(),
      tokenAmount: pkg.tokens.toString(),
      type: 'auto_reload',
    },
  });

  if (paymentIntent.status === 'succeeded') {
    // Credit tokens
    const transaction = await purchaseTokens({
      teamId,
      packageId,
      stripePaymentIntentId: paymentIntent.id,
      type: 'auto_reload',
    });

    return transaction;
  }

  return null;
}
