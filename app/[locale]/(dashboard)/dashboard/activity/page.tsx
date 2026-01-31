'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { useTranslations } from 'next-intl';
import { History, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ActivityLogList,
  ActivityLogFilters,
} from '@/components/activity';
import type { ActivityLog, ActivityLogFilters as Filters } from '@/lib/activity/types';

interface ActivityResponse {
  logs: ActivityLog[];
  total: number;
  limit: number;
  offset: number;
}

interface TeamMember {
  id: number;
  name: string | null;
  email: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function buildQueryString(filters: Filters, limit: number, offset: number): string {
  const params = new URLSearchParams();
  params.set('limit', limit.toString());
  params.set('offset', offset.toString());

  if (filters.userId) params.set('userId', filters.userId.toString());
  if (filters.action) params.set('action', filters.action);
  if (filters.entityType) params.set('entityType', filters.entityType);
  if (filters.entityId) params.set('entityId', filters.entityId.toString());
  if (filters.search) params.set('search', filters.search);
  if (filters.startDate) params.set('startDate', filters.startDate.toISOString());
  if (filters.endDate) params.set('endDate', filters.endDate.toISOString());

  return params.toString();
}

export default function ActivityPage() {
  const t = useTranslations('dashboard.activity');
  const [filters, setFilters] = useState<Filters>({});
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);

  const queryString = buildQueryString(filters, limit, offset);
  const { data, error, isLoading } = useSWR<ActivityResponse>(
    `/api/activity?${queryString}`,
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
      revalidateOnFocus: true,
    }
  );

  // Fetch team members for user filter
  const { data: teamData } = useSWR<{ teamMembers: TeamMember[] }>(
    '/api/team/members',
    fetcher
  );

  const handleFiltersChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
    setOffset(0); // Reset pagination when filters change
  }, []);

  const handlePageChange = useCallback((newOffset: number) => {
    setOffset(newOffset);
  }, []);

  const handleExport = useCallback(async () => {
    // Build CSV data
    if (!data?.logs) return;

    const headers = ['Timestamp', 'User', 'Action', 'Entity Type', 'Entity Name', 'IP Address'];
    const rows = data.logs.map((log) => [
      new Date(log.timestamp).toISOString(),
      log.user?.name || log.user?.email || 'System',
      log.action,
      log.entityType || '',
      log.entityName || '',
      log.ipAddress || '',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activity-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data?.logs]);

  const users = teamData?.teamMembers?.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
  })) || [];

  return (
    <section className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 rounded-lg">
            <History className="h-6 w-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-lg lg:text-2xl font-medium text-gray-900">
              {t('title')}
            </h1>
            <p className="text-sm text-gray-500">{t('description')}</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={!data?.logs?.length}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <ActivityLogFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            users={users}
          />
        </CardContent>
      </Card>

      {/* Activity List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Activity History</span>
            {data && (
              <span className="text-sm font-normal text-muted-foreground">
                {data.total} total activities
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8 text-red-500">
              Failed to load activity logs. Please try again.
            </div>
          ) : (
            <ActivityLogList
              logs={data?.logs || []}
              total={data?.total || 0}
              limit={limit}
              offset={offset}
              isLoading={isLoading}
              showChanges={true}
              onPageChange={handlePageChange}
            />
          )}
        </CardContent>
      </Card>
    </section>
  );
}
