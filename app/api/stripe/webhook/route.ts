import Stripe from 'stripe';
import { handleSubscriptionChange, stripe } from '@/lib/payments/stripe';
import { sendSubscriptionConfirmationEmail, sendSubscriptionCancellationEmail } from '@/lib/email/service';
import { getTeamByStripeCustomerId, getUserById } from '@/lib/db/queries';
import { NextRequest, NextResponse } from 'next/server';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed.' },
      { status: 400 }
    );
  }

  switch (event.type) {
    case 'customer.subscription.created': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionChange(subscription);

      // Send subscription confirmation email
      try {
        const team = await getTeamByStripeCustomerId(subscription.customer as string);
        if (team) {
          const plan = subscription.items.data[0]?.plan;
          const productObj = typeof plan?.product === 'string'
            ? await stripe.products.retrieve(plan.product)
            : plan?.product as Stripe.Product;

          const trialEndDate = subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : undefined;

          // Get the team owner to send email to
          const owner = await getUserById(team.ownerId);
          if (owner) {
            sendSubscriptionConfirmationEmail({
              email: owner.email,
              name: owner.name || undefined,
              teamName: team.name,
              planName: productObj?.name || 'Plan Premium',
              trialEndDate,
              planPrice: plan?.amount || undefined,
              planInterval: plan?.interval || undefined,
            }).catch(err => console.error('Failed to send subscription confirmation:', err));
          }
        }
      } catch (error) {
        console.error('Error sending subscription confirmation email:', error);
      }
      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionChange(subscription);

      // Send cancellation email if subscription was cancelled
      if (event.type === 'customer.subscription.deleted' ||
          (event.type === 'customer.subscription.updated' && subscription.cancel_at_period_end)) {
        try {
          const team = await getTeamByStripeCustomerId(subscription.customer as string);
          if (team) {
            const plan = subscription.items.data[0]?.plan;
            const productObj = typeof plan?.product === 'string'
              ? await stripe.products.retrieve(plan.product)
              : plan?.product as Stripe.Product;

            const endDate = subscription.current_period_end
              ? new Date(subscription.current_period_end * 1000)
              : undefined;

            // Get the team owner to send email to
            const owner = await getUserById(team.ownerId);
            if (owner) {
              sendSubscriptionCancellationEmail({
                email: owner.email,
                name: owner.name || undefined,
                teamName: team.name,
                planName: productObj?.name || 'Plan Premium',
                endDate,
              }).catch(err => console.error('Failed to send cancellation confirmation:', err));
            }
          }
        } catch (error) {
          console.error('Error sending cancellation confirmation email:', error);
        }
      }
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
