'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Coins, ShoppingCart, History, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import useSWR from 'swr';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { useTranslations } from 'next-intl';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function TokenBalanceCard() {
  const t = useTranslations('dashboard.billing.balance');
  const { data, isLoading } = useSWR<{ balance: number }>('/api/tokens/balance', fetcher);

  return (
    <Card className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          {t('title')}
        </CardTitle>
        <CardDescription className="text-violet-100">
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          {isLoading ? (
            <Skeleton className="h-12 w-24 bg-violet-400/50" />
          ) : (
            <span className="text-5xl font-bold">{data?.balance ?? 0}</span>
          )}
          <span className="text-xl text-violet-200">{t('tokens')}</span>
        </div>
        <p className="mt-2 text-sm text-violet-200">
          {t('info')}
        </p>
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  const t = useTranslations('dashboard.billing.quickActions');
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Link href="/dashboard/billing/packages">
        <Card className="hover:border-violet-500 transition-colors cursor-pointer h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5 text-violet-500" />
              {t('buyTokens.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {t('buyTokens.description')}
            </p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/dashboard/billing/history">
        <Card className="hover:border-violet-500 transition-colors cursor-pointer h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-5 w-5 text-violet-500" />
              {t('history.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {t('history.description')}
            </p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/dashboard/billing/settings">
        <Card className="hover:border-violet-500 transition-colors cursor-pointer h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-violet-500" />
              {t('autoReload.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              {t('autoReload.description')}
            </p>
          </CardContent>
        </Card>
      </Link>
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
      <Alert variant="success" className="mb-6">
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          {t('success')}
        </AlertDescription>
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
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
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        {t('title')}
      </h1>

      <Suspense fallback={null}>
        <StatusMessage />
      </Suspense>

      <div className="space-y-6">
        <TokenBalanceCard />
        <QuickActions />
      </div>
    </section>
  );
}
