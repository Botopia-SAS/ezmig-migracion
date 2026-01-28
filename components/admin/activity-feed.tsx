'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  LogIn,
  UserPlus,
  Coins,
  Zap,
  RefreshCw,
  UserCheck,
  Settings,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActivityFeedItem } from '@/lib/tokens/demo-data';

interface ActivityFeedProps {
  items: ActivityFeedItem[];
}

const actionIcons: Record<string, typeof Activity> = {
  SIGN_UP: UserPlus,
  SIGN_IN: LogIn,
  PURCHASE_TOKENS: Coins,
  CONSUME_TOKEN: Zap,
  AUTO_RELOAD_TOKENS: RefreshCw,
  INVITE_TEAM_MEMBER: UserCheck,
  UPDATE_AUTO_RELOAD: Settings,
};

const actionLabels: Record<string, string> = {
  SIGN_UP: 'signed up',
  SIGN_IN: 'signed in',
  PURCHASE_TOKENS: 'purchased tokens',
  CONSUME_TOKEN: 'used a token',
  AUTO_RELOAD_TOKENS: 'auto-reload triggered',
  INVITE_TEAM_MEMBER: 'invited team member',
  UPDATE_AUTO_RELOAD: 'updated auto-reload settings',
};

const actionColors: Record<string, string> = {
  SIGN_UP: 'text-green-500 bg-green-50',
  SIGN_IN: 'text-blue-500 bg-blue-50',
  PURCHASE_TOKENS: 'text-violet-500 bg-violet-50',
  CONSUME_TOKEN: 'text-orange-500 bg-orange-50',
  AUTO_RELOAD_TOKENS: 'text-indigo-500 bg-indigo-50',
  INVITE_TEAM_MEMBER: 'text-cyan-500 bg-cyan-50',
  UPDATE_AUTO_RELOAD: 'text-gray-500 bg-gray-50',
};

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getInitials(name: string | null, email: string | null): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return 'U';
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest platform activity</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No recent activity
          </div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => {
              const Icon = actionIcons[item.action] ?? Activity;
              const label = actionLabels[item.action] ?? item.action;
              const colorClass = actionColors[item.action] ?? 'text-gray-500 bg-gray-50';

              return (
                <div key={item.id} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(item.userName, item.userEmail)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className={cn('p-1 rounded', colorClass)}>
                        <Icon className="h-3 w-3" />
                      </div>
                      <span className="font-medium text-sm truncate">
                        {item.userName ?? item.userEmail ?? 'Unknown user'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {label}
                      {item.teamName && (
                        <span className="text-foreground"> at {item.teamName}</span>
                      )}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTimeAgo(new Date(item.timestamp))}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
