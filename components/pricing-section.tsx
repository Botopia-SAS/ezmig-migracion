'use client';

import useSWR from 'swr';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type PlanPrice = {
  amount: number;
  currency: string;
  interval: string;
};

type PricingResponse = {
  base: PlanPrice | null;
  plus: PlanPrice | null;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function PricingSection() {
  const t = useTranslations('landing.pricing');
  const locale = useLocale();
  const { data } = useSWR<PricingResponse>('/api/pricing', fetcher, {
    revalidateOnFocus: false,
  });

  const plans = [
    {
      key: 'starter',
      features: ['feature1', 'feature2', 'feature3'],
      popular: false,
    },
    {
      key: 'growth',
      features: ['feature1', 'feature2', 'feature3', 'feature4'],
      popular: true,
    },
    {
      key: 'enterprise',
      features: ['feature1', 'feature2', 'feature3', 'feature4'],
      popular: false,
    },
  ];

  const planPriceMap: Record<string, PlanPrice | null | undefined> = {
    starter: data?.base,
    growth: data?.plus,
  };

  const formatPrice = (price?: PlanPrice | null) => {
    if (!price) return null;
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: price.currency.toUpperCase(),
      maximumFractionDigits: 2,
    }).format(price.amount / 100);
  };

  return (
    <section id="pricing" className="w-full py-24 bg-gray-50/50 dark:bg-neutral-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-neutral-900 dark:text-white tracking-tight">
            {t('title')}
          </h2>
          <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.key}
              className={cn(
                'relative transition-all duration-300 hover:shadow-lg',
                plan.popular
                  ? 'border-violet-400 dark:border-violet-300 shadow-md scale-[1.02] md:scale-105'
                  : 'border-gray-200 dark:border-neutral-800 hover:border-violet-200 dark:hover:border-violet-700'
              )}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center justify-center bg-gradient-to-r from-violet-400 to-indigo-400 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-sm whitespace-nowrap">
                    {t(`${plan.key}.badge`)}
                  </span>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl font-semibold text-neutral-900 dark:text-white">
                  {t(`${plan.key}.name`)}
                </CardTitle>
                <CardDescription className="mt-2">
                  <span className="text-4xl font-bold text-neutral-900 dark:text-white">
                    {formatPrice(planPriceMap[plan.key]) || t(`${plan.key}.price`)}
                  </span>
                  <span className="text-neutral-500 dark:text-neutral-400 ml-1">
                    {planPriceMap[plan.key]?.interval
                      ? `/ ${planPriceMap[plan.key]?.interval}`
                      : t(`${plan.key}.credits`)}
                  </span>
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-6">
                <ul className="space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className={cn(
                        'flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5',
                        plan.popular
                          ? 'bg-violet-100 dark:bg-violet-900/50'
                          : 'bg-gray-100 dark:bg-neutral-800'
                      )}>
                        <Check className={cn(
                          'w-3 h-3',
                          plan.popular
                            ? 'text-violet-500 dark:text-violet-400'
                            : 'text-neutral-600 dark:text-neutral-400'
                        )} />
                      </div>
                      <span className="text-sm text-neutral-600 dark:text-neutral-300">
                        {t(`${plan.key}.${feature}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-6">
                <Button
                  asChild
                  className={cn(
                    'w-full',
                    plan.popular
                      ? 'bg-gradient-to-r from-violet-400 to-indigo-400 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md'
                      : 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700'
                  )}
                >
                  <Link href="/sign-up">
                    {plan.key === 'enterprise' ? t('contactSales') : t('getStarted')}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
