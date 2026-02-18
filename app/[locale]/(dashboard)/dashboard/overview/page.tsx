'use client';

import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { AlertCircle, LayoutDashboard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  OverviewStatsGrid,
  CasesByStatusChart,
  CasesByTypeChart,
  UpcomingDeadlinesList,
} from '@/components/dashboard/overview';

interface OverviewResponse {
  caseStats: {
    total: number;
    active: number;
    byStatus: { status: string; count: number }[];
    byType: { caseType: string; count: number }[];
  };
  clientStats: {
    total: number;
    withCases: number;
  };
  upcomingDeadlines: {
    id: number;
    caseNumber: string;
    clientName: string | null;
    caseType: string;
    filingDeadline: string;
    daysRemaining: number;
  }[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function OverviewSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-40 mb-2" />
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
      </div>

      {/* Deadlines Skeleton */}
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function OverviewPage() {
  const t = useTranslations('dashboard.overview');
  const tCases = useTranslations('dashboard.cases');

  const { data, error, isLoading } = useSWR<OverviewResponse>(
    '/api/overview',
    fetcher,
    {
      refreshInterval: 60000, // Refresh every minute
      revalidateOnFocus: true,
    }
  );

  if (isLoading) {
    return (
      <section className="flex-1">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-violet-100 rounded-lg">
            <LayoutDashboard className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
              {t('title')}
            </h1>
            <p className="text-sm text-gray-500">{t('subtitle')}</p>
          </div>
        </div>
        <OverviewSkeleton />
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="flex-1">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-violet-100 rounded-lg">
            <LayoutDashboard className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
              {t('title')}
            </h1>
            <p className="text-sm text-gray-500">{t('subtitle')}</p>
          </div>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
            <p className="text-red-600">Failed to load overview data</p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="flex-1">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-violet-100 rounded-lg">
          <LayoutDashboard className="h-6 w-6 text-violet-600" />
        </div>
        <div>
          <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
            {t('title')}
          </h1>
          <p className="text-sm text-gray-500">{t('subtitle')}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-6">
        <OverviewStatsGrid
          totalCases={data.caseStats.total}
          activeCases={data.caseStats.active}
          totalClients={data.clientStats.total}
          clientsWithCases={data.clientStats.withCases}
          t={t}
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <CasesByStatusChart
          data={data.caseStats.byStatus}
          t={t}
          tStatus={(key) => tCases(`statuses.${key}`)}
        />
        <CasesByTypeChart
          data={data.caseStats.byType}
          t={t}
          tType={(key) => tCases(`types.${key}`)}
        />
      </div>

      {/* Upcoming Deadlines */}
      <UpcomingDeadlinesList
        deadlines={data.upcomingDeadlines}
        t={t}
        tType={(key) => tCases(`types.${key}`)}
      />
    </section>
  );
}
