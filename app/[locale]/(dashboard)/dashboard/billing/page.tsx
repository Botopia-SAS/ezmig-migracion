'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  CheckCircle,
  Crown,
  CreditCard,
  Check,
  Loader2,
  Sparkles,
} from 'lucide-react';
import useSWR from 'swr';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { useFormStatus } from 'react-dom';
import { customerPortalAction, checkoutAction } from '@/lib/payments/actions';
import { TeamDataWithMembers } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Plan {
  id: string;
  name: string;
  description: string | null;
  priceId: string | undefined;
  price: number;
  interval: string;
  features: string[];
}

interface PlansData {
  plans: Plan[];
  currentPlan: string | null;
  subscriptionStatus: string | null;
}

function SubscribeButton({ disabled }: { disabled?: boolean }) {
  const t = useTranslations('dashboard.billing.plans');
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending || disabled}
      className="w-full bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t('processing')}
        </>
      ) : (
        t('subscribe')
      )}
    </Button>
  );
}

function CurrentPlanBadge({ status }: { status: string | null | undefined }) {
  const t = useTranslations('dashboard.billing.subscription');

  const statusLabel =
    status === 'active'
      ? t('active')
      : status === 'trialing'
        ? t('trialing')
        : status === 'canceled'
          ? t('canceled')
          : t('noSubscription');

  const statusColor =
    status === 'active'
      ? 'text-green-600 bg-green-50 border-green-200'
      : status === 'trialing'
        ? 'text-violet-600 bg-violet-50 border-violet-200'
        : status === 'canceled'
          ? 'text-red-600 bg-red-50 border-red-200'
          : 'text-gray-500 bg-gray-50 border-gray-200';

  return (
    <span
      className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full border ${statusColor}`}
    >
      {statusLabel}
    </span>
  );
}

function BillingContent() {
  const t = useTranslations('dashboard.billing');
  const tp = useTranslations('dashboard.billing.plans');
  const ts = useTranslations('dashboard.billing.subscription');

  const { data: teamData } = useSWR<TeamDataWithMembers>('/api/team', fetcher);
  const { data: plansData, isLoading: plansLoading } = useSWR<PlansData>(
    '/api/billing/plans',
    fetcher
  );

  const planName = teamData?.planName || ts('free');
  const status = teamData?.subscriptionStatus;
  const hasActiveSubscription = status === 'active' || status === 'trialing';

  const plans = plansData?.plans ?? [];

  return (
    <div className="max-w-3xl space-y-6">
      {/* Current Plan */}
      <Card>
        <CardContent className="flex items-center justify-between py-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 rounded-lg">
              <Crown className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="font-semibold text-lg">{planName}</p>
              <CurrentPlanBadge status={status} />
            </div>
          </div>
          {hasActiveSubscription && (
            <form action={customerPortalAction}>
              <Button type="submit" variant="outline" size="sm">
                {ts('manageSub')}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Plans */}
      <div>
        <h2 className="text-base font-medium text-gray-900 mb-1">
          {tp('title')}
        </h2>
        <p className="text-sm text-gray-500 mb-4">{tp('subtitle')}</p>

        {plansLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
          </div>
        ) : plans.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500 text-sm">
              {tp('noPlans')}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.map((plan, index) => {
              const isCurrent =
                hasActiveSubscription && plansData?.currentPlan === plan.name;
              const isHighlighted = index === plans.length - 1;
              const isAvailable = Boolean(plan.priceId);

              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col ${
                    isHighlighted
                      ? 'border-violet-500 border-2 shadow-md'
                      : ''
                  }`}
                >
                  {isHighlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-violet-500 text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        {tp('recommended')}
                      </span>
                    </div>
                  )}

                  <CardHeader className="pb-3 pt-6">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {plan.description && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {plan.description}
                      </p>
                    )}
                    <div className="mt-3">
                      <span className="text-3xl font-bold">
                        ${(plan.price / 100).toFixed(0)}
                      </span>
                      <span className="text-gray-500 text-sm ml-1">
                        {tp('perMonth')}
                      </span>
                    </div>
                    <p className="text-xs text-violet-600">{tp('trialInfo')}</p>
                  </CardHeader>

                  <CardContent className="flex-1 pt-0">
                    <ul className="space-y-2">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter className="flex flex-col gap-2 pt-0">
                    {isCurrent ? (
                      <>
                        <Button disabled className="w-full" variant="outline">
                          {tp('currentPlan')}
                        </Button>
                        <form action={customerPortalAction} className="w-full">
                          <Button
                            type="submit"
                            variant="ghost"
                            className="w-full text-violet-600"
                            size="sm"
                          >
                            {tp('manageSub')}
                          </Button>
                        </form>
                      </>
                    ) : hasActiveSubscription ? (
                      <form action={customerPortalAction} className="w-full">
                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white"
                        >
                          {tp('switchPlan')}
                        </Button>
                      </form>
                    ) : (
                      <form action={checkoutAction} className="w-full">
                        <input
                          type="hidden"
                          name="priceId"
                          value={plan.priceId || ''}
                        />
                        <SubscribeButton disabled={!isAvailable} />
                      </form>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusMessage() {
  const t = useTranslations('dashboard.billing.status');
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const error = searchParams.get('error');

  if (success) {
    return (
      <Alert variant="success" className="mb-6 max-w-3xl">
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          {success === 'subscription'
            ? t('subscriptionSuccess')
            : t('success')}
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6 max-w-3xl">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error === 'payment_failed' ? t('paymentFailed') : t('error')}
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

export default function BillingPage() {
  const t = useTranslations('dashboard.billing');
  return (
    <section className="flex-1">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-violet-100 rounded-lg">
          <CreditCard className="h-6 w-6 text-violet-600" />
        </div>
        <div>
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            {t('title')}
          </h1>
          <p className="text-sm text-gray-500">{t('subtitle')}</p>
        </div>
      </div>

      <Suspense fallback={null}>
        <StatusMessage />
      </Suspense>

      <BillingContent />
    </section>
  );
}
