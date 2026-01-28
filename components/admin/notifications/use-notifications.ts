'use client';

import useSWR from 'swr';

interface SystemAlert {
  message: string;
  count: number;
  time: string;
}

interface SystemAlerts {
  critical: SystemAlert[];
  warnings: SystemAlert[];
}

interface AlertsResponse {
  alerts: SystemAlerts;
  totalCount: number;
  hasAlerts: boolean;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useNotifications() {
  const { data, error, isLoading, mutate } = useSWR<AlertsResponse>(
    '/api/admin/alerts',
    fetcher,
    { refreshInterval: 60000 } // Refresh every minute
  );

  return {
    alerts: data?.alerts ?? { critical: [], warnings: [] },
    totalCount: data?.totalCount ?? 0,
    hasAlerts: data?.hasAlerts ?? false,
    isLoading,
    error,
    refresh: mutate,
  };
}
