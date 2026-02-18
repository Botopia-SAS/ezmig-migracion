'use client';

import { formatDistanceToNow } from 'date-fns';
import { es, enUS } from 'date-fns/locale';
import {
  UserPlus,
  UserCog,
  UserMinus,
  FolderPlus,
  FolderCog,
  FolderMinus,
  UserCheck,
  FileText,
  FileCheck,
  Link2,
  LogIn,
  HelpCircle,
  MapPin,
  Monitor,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ActivityChanges } from './activity-changes';
import type { ActivityLog } from '@/lib/activity/types';
import { cn } from '@/lib/utils';

interface ActivityLogItemProps {
  log: ActivityLog;
  locale?: string;
  showChanges?: boolean;
}

const actionConfig: Record<string, { icon: typeof UserPlus; color: string; label: string }> = {
  CREATE_CLIENT: { icon: UserPlus, color: 'text-green-600 bg-green-100', label: 'Created client' },
  UPDATE_CLIENT: { icon: UserCog, color: 'text-blue-600 bg-blue-100', label: 'Updated client' },
  DELETE_CLIENT: { icon: UserMinus, color: 'text-red-600 bg-red-100', label: 'Deleted client' },
  CREATE_CASE: { icon: FolderPlus, color: 'text-green-600 bg-green-100', label: 'Created case' },
  UPDATE_CASE: { icon: FolderCog, color: 'text-blue-600 bg-blue-100', label: 'Updated case' },
  DELETE_CASE: { icon: FolderMinus, color: 'text-red-600 bg-red-100', label: 'Deleted case' },
  ASSIGN_CASE: { icon: UserCheck, color: 'text-violet-600 bg-violet-100', label: 'Assigned case' },
  CREATE_FORM: { icon: FileText, color: 'text-green-600 bg-green-100', label: 'Created form' },
  UPDATE_FORM: { icon: FileText, color: 'text-blue-600 bg-blue-100', label: 'Updated form' },
  SUBMIT_FORM: { icon: FileCheck, color: 'text-emerald-600 bg-emerald-100', label: 'Submitted form' },
  CREATE_REFERRAL_LINK: { icon: Link2, color: 'text-violet-600 bg-violet-100', label: 'Created referral link' },
  SIGN_IN: { icon: LogIn, color: 'text-gray-600 bg-gray-100', label: 'Signed in' },
  SIGN_UP: { icon: UserPlus, color: 'text-green-600 bg-green-100', label: 'Signed up' },
};

const defaultConfig = { icon: HelpCircle, color: 'text-gray-600 bg-gray-100', label: 'Activity' };

export function ActivityLogItem({ log, locale = 'en', showChanges = true }: ActivityLogItemProps) {
  const config = actionConfig[log.action] || defaultConfig;
  const Icon = config.icon;
  const dateLocale = locale === 'es' ? es : enUS;

  const timeAgo = formatDistanceToNow(new Date(log.timestamp), {
    addSuffix: true,
    locale: dateLocale,
  });

  const formattedTime = new Date(log.timestamp).toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const userInitials = log.user?.name
    ? log.user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : log.user?.email?.slice(0, 2).toUpperCase() || '??';

  return (
    <div className="flex gap-4 p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
      {/* Icon */}
      <div className={cn('p-2 rounded-lg h-fit', config.color.split(' ')[1])}>
        <Icon className={cn('h-4 w-4', config.color.split(' ')[0])} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-xs bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm">
              {log.user?.name || log.user?.email || 'System'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{formattedTime}</span>
            <span className="text-muted-foreground/50">({timeAgo})</span>
          </div>
        </div>

        {/* Action description */}
        <p className="mt-1 text-sm">
          <span className="text-muted-foreground">{config.label}</span>
          {log.entityName && (
            <span className="ml-1 font-medium text-foreground">
              "{log.entityName}"
            </span>
          )}
        </p>

        {/* Changes */}
        {showChanges && log.changes && Object.keys(log.changes).length > 0 && (
          <div className="mt-2">
            <ActivityChanges changes={log.changes} />
          </div>
        )}

        {/* Metadata footer */}
        {(log.ipAddress || log.userAgent) && (
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            {log.ipAddress && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {log.ipAddress}
              </span>
            )}
            {log.userAgent && (
              <span className="flex items-center gap-1">
                <Monitor className="h-3 w-3" />
                {log.userAgent}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
