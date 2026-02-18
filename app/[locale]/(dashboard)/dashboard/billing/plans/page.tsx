'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, Loader2, Crown, Sparkles } from 'lucide-react';
import useSWR from 'swr';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useFormStatus } from 'react-dom';
import { checkoutAction, customerPortalAction } from '@/lib/payments/actions';

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

function PlanCard({
  plan,
  isCurrent,
  hasSubscription,
  isHighlighted,
}: {
  plan: Plan;
  isCurrent: boolean;
  hasSubscription: boolean;
  isHighlighted: boolean;
}) {
  const t = useTranslations('dashboard.billing.plans');
  const isAvailable = Boolean(plan.priceId);

  return (
    <Card
      className={`relative flex flex-col ${
        isHighlighted ? 'border-violet-500 border-2 shadow-lg' : ''
      }`}
    >
      {isHighlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-violet-500 text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            {t('recommended')}
          </span>
        </div>
      )}

      <CardHeader className="text-center pt-8">
        <div className="mx-auto mb-2 p-3 bg-violet-100 rounded-full w-fit">
          <Crown className="h-6 w-6 text-violet-600" />
        </div>
        <CardTitle className="text-xl">{plan.name}</CardTitle>
        {plan.description && (
          <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
        )}
        <div className="mt-4">
          <span className="text-4xl font-bold">${(plan.price / 100).toFixed(0)}</span>
          <span className="text-gray-500 ml-1">{t('perMonth')}</span>
        </div>
        <p className="text-xs text-violet-600 mt-1">{t('trialInfo')}</p>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-3">
          {plan.features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        {isCurrent ? (
          <>
            <Button disabled className="w-full" variant="outline">
              {t('currentPlan')}
            </Button>
            <form action={customerPortalAction} className="w-full">
              <Button type="submit" variant="ghost" className="w-full text-violet-600">
                {t('manageSub')}
              </Button>
            </form>
          </>
        ) : hasSubscription ? (
          <form action={customerPortalAction} className="w-full">
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white"
            >
              {t('switchPlan')}
            </Button>
          </form>
        ) : (
          <form action={checkoutAction} className="w-full">
            <input type="hidden" name="priceId" value={plan.priceId || ''} />
            <SubscribeButton disabled={!isAvailable} />
          </form>
        )}
      </CardFooter>
    </Card>
  );
}

export default function PlansPage() {
  const t = useTranslations('dashboard.billing.plans');
  const { data, isLoading } = useSWR<PlansData>('/api/billing/plans', fetcher);

  const plans = data?.plans ?? [];
  const currentPlan = data?.currentPlan;
  const subscriptionStatus = data?.subscriptionStatus;
  const hasActiveSubscription =
    subscriptionStatus === 'active' || subscriptionStatus === 'trialing';

  return (
    <section className="flex-1">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard/billing">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-gray-900 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
            {t('back')}
          </Button>
        </Link>
        <div>
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            {t('title')}
          </h1>
          <p className="text-sm text-gray-500">{t('subtitle')}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
        </div>
      ) : plans.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            {t('noPlans')}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {plans.map((plan, index) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={hasActiveSubscription && currentPlan === plan.name}
              hasSubscription={hasActiveSubscription}
              isHighlighted={index === plans.length - 1}
            />
          ))}
        </div>
      )}
    </section>
  );
}
