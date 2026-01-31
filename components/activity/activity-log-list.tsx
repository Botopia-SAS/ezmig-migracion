'use client';

import { ActivityLogItem } from './activity-log-item';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import type { ActivityLog } from '@/lib/activity/types';

interface ActivityLogListProps {
  logs: ActivityLog[];
  total: number;
  limit: number;
  offset: number;
  isLoading?: boolean;
  locale?: string;
  showChanges?: boolean;
  onPageChange?: (offset: number) => void;
}

function ActivityLogSkeleton() {
  return (
    <div className="flex gap-4 p-4 rounded-lg border bg-card">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}

export function ActivityLogList({
  logs,
  total,
  limit,
  offset,
  isLoading = false,
  locale = 'en',
  showChanges = true,
  onPageChange,
}: ActivityLogListProps) {
  const currentPage = Math.floor(offset / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = offset + limit < total;
  const hasPrevPage = offset > 0;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <ActivityLogSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-3 bg-muted rounded-full mb-4">
          <Inbox className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-medium text-lg">No activity found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          There are no activity logs matching your filters.
        </p>
      </div>
    );
  }

  // Group logs by date
  const groupedLogs = logs.reduce<Record<string, ActivityLog[]>>((acc, log) => {
    const date = new Date(log.timestamp).toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Grouped activity logs */}
      {Object.entries(groupedLogs).map(([date, dateLogs]) => (
        <div key={date}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3 sticky top-0 bg-background py-2">
            {date}
          </h3>
          <div className="space-y-3">
            {dateLogs.map((log) => (
              <ActivityLogItem
                key={log.id}
                log={log}
                locale={locale}
                showChanges={showChanges}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} activities
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(Math.max(0, offset - limit))}
              disabled={!hasPrevPage}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(offset + limit)}
              disabled={!hasNextPage}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
