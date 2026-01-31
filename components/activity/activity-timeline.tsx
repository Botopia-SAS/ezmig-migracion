'use client';

import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import {
  UserPlus,
  UserCog,
  FolderPlus,
  FolderCog,
  UserCheck,
  FileText,
  FileCheck,
  Link2,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ActivityChanges } from './activity-changes';
import { Skeleton } from '@/components/ui/skeleton';
import type { ActivityLog } from '@/lib/activity/types';

interface ActivityTimelineProps {
  logs: ActivityLog[];
  isLoading?: boolean;
  locale?: string;
  maxItems?: number;
}

const actionConfig: Record<string, { icon: typeof UserPlus; color: string; label: string }> = {
  CREATE_CLIENT: { icon: UserPlus, color: 'bg-green-500', label: 'Created' },
  UPDATE_CLIENT: { icon: UserCog, color: 'bg-blue-500', label: 'Updated' },
  DELETE_CLIENT: { icon: UserCog, color: 'bg-red-500', label: 'Deleted' },
  CREATE_CASE: { icon: FolderPlus, color: 'bg-green-500', label: 'Created' },
  UPDATE_CASE: { icon: FolderCog, color: 'bg-blue-500', label: 'Updated' },
  DELETE_CASE: { icon: FolderCog, color: 'bg-red-500', label: 'Deleted' },
  ASSIGN_CASE: { icon: UserCheck, color: 'bg-violet-500', label: 'Assigned' },
  CREATE_FORM: { icon: FileText, color: 'bg-green-500', label: 'Form created' },
  UPDATE_FORM: { icon: FileText, color: 'bg-blue-500', label: 'Form updated' },
  SUBMIT_FORM: { icon: FileCheck, color: 'bg-emerald-500', label: 'Form submitted' },
  CREATE_REFERRAL_LINK: { icon: Link2, color: 'bg-violet-500', label: 'Referral created' },
};

const defaultConfig = { icon: HelpCircle, color: 'bg-gray-500', label: 'Activity' };

function TimelineSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-full w-0.5 mt-2" />
          </div>
          <div className="flex-1 pb-6">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActivityTimeline({
  logs,
  isLoading = false,
  locale = 'en',
  maxItems,
}: ActivityTimelineProps) {
  const dateLocale = locale === 'es' ? es : enUS;
  const displayLogs = maxItems ? logs.slice(0, maxItems) : logs;

  if (isLoading) {
    return <TimelineSkeleton />;
  }

  if (logs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No activity recorded yet.
      </p>
    );
  }

  return (
    <div className="relative">
      {displayLogs.map((log, index) => {
        const config = actionConfig[log.action] || defaultConfig;
        const Icon = config.icon;
        const isLast = index === displayLogs.length - 1;

        return (
          <div key={log.id} className="flex gap-3">
            {/* Timeline indicator */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex items-center justify-center h-8 w-8 rounded-full text-white',
                  config.color
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              {!isLast && (
                <div className="w-0.5 h-full bg-border flex-1 min-h-[24px]" />
              )}
            </div>

            {/* Content */}
            <div className={cn('flex-1', !isLast && 'pb-6')}>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{config.label}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(log.timestamp), {
                    addSuffix: true,
                    locale: dateLocale,
                  })}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mt-0.5">
                by {log.user?.name || log.user?.email || 'System'}
              </p>

              {/* Changes */}
              {log.changes && Object.keys(log.changes).length > 0 && (
                <div className="mt-2">
                  <ActivityChanges changes={log.changes} className="text-xs" />
                </div>
              )}
            </div>
          </div>
        );
      })}

      {maxItems && logs.length > maxItems && (
        <p className="text-sm text-muted-foreground text-center mt-4">
          +{logs.length - maxItems} more activities
        </p>
      )}
    </div>
  );
}
