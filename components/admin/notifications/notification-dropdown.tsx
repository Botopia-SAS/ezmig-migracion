'use client';

import { XCircle, AlertTriangle, Bell } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface SystemAlert {
  message: string;
  count: number;
  time: string;
}

interface SystemAlerts {
  critical: SystemAlert[];
  warnings: SystemAlert[];
}

interface NotificationDropdownProps {
  alerts: SystemAlerts;
  isLoading: boolean;
  onClose: () => void;
}

export function NotificationDropdown({
  alerts,
  isLoading,
  onClose,
}: NotificationDropdownProps) {
  const allAlerts = [
    ...alerts.critical.map((a) => ({ ...a, type: 'critical' as const })),
    ...alerts.warnings.map((a) => ({ ...a, type: 'warning' as const })),
  ];

  if (isLoading) {
    return (
      <div className="p-4 text-center text-gray-500">
        Loading notifications...
      </div>
    );
  }

  if (allAlerts.length === 0) {
    return (
      <div className="p-6 text-center">
        <Bell className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500">No notifications</p>
      </div>
    );
  }

  return (
    <div>
      <div className="px-4 py-3 border-b">
        <h3 className="font-semibold text-gray-900">Notifications</h3>
        <p className="text-xs text-gray-500">
          {allAlerts.length} alert{allAlerts.length !== 1 ? 's' : ''} requiring
          attention
        </p>
      </div>

      <ScrollArea className="max-h-80">
        {allAlerts.map((alert, idx) => (
          <div
            key={idx}
            className={cn(
              'px-4 py-3 border-b last:border-0 hover:bg-gray-50',
              alert.type === 'critical' && 'bg-red-50/50',
              alert.type === 'warning' && 'bg-yellow-50/50'
            )}
          >
            <div className="flex items-start gap-3">
              {alert.type === 'critical' ? (
                <XCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {alert.message}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {alert.count} tenant{alert.count !== 1 ? 's' : ''} •{' '}
                  {alert.time}
                </p>
              </div>
            </div>
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}
