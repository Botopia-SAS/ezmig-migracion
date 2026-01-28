'use client';

import { cn } from '@/lib/utils';

interface SystemStatusBadgeProps {
  status?: 'online' | 'offline' | 'degraded';
  compact?: boolean;
  className?: string;
}

export function SystemStatusBadge({
  status = 'online',
  compact = false,
  className,
}: SystemStatusBadgeProps) {
  const statusConfig = {
    online: {
      label: 'System Online',
      compactLabel: 'Online',
      dotColor: 'bg-green-500',
      textColor: 'text-green-600',
    },
    offline: {
      label: 'System Offline',
      compactLabel: 'Offline',
      dotColor: 'bg-red-500',
      textColor: 'text-red-600',
    },
    degraded: {
      label: 'Degraded Performance',
      compactLabel: 'Degraded',
      dotColor: 'bg-yellow-500',
      textColor: 'text-yellow-600',
    },
  };

  const config = statusConfig[status];

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full bg-white border border-gray-200 shadow-sm',
        compact ? 'px-2 py-1' : 'px-3 py-1.5',
        className
      )}
    >
      <span className="relative flex h-2.5 w-2.5">
        <span
          className={cn(
            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
            config.dotColor
          )}
        />
        <span
          className={cn(
            'relative inline-flex rounded-full h-2.5 w-2.5',
            config.dotColor
          )}
        />
      </span>
      <span
        className={cn(
          'font-medium',
          compact ? 'text-xs' : 'text-sm',
          config.textColor
        )}
      >
        {compact ? config.compactLabel : config.label}
      </span>
    </div>
  );
}
