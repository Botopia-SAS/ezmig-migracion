'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { NotificationDropdown } from './notification-dropdown';
import { useNotifications } from './use-notifications';

export function NotificationBell() {
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);
  const { alerts, totalCount, hasAlerts, isLoading } = useNotifications();

  useEffect(() => {
    // Avoid SSR/client ID mismatches in popover controls
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications${hasAlerts ? ` (${totalCount} pending)` : ''}`}
        >
          <Bell className="h-5 w-5 text-gray-600" />
          {hasAlerts && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
              {totalCount > 9 ? '9+' : totalCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <NotificationDropdown
          alerts={alerts}
          isLoading={isLoading}
          onClose={() => setOpen(false)}
        />
      </PopoverContent>
    </Popover>
  );
}
