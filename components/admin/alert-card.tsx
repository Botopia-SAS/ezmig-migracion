'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertItem {
  message: string;
  count: number;
  time: string;
}

interface AlertCardProps {
  type: 'critical' | 'warning';
  title: string;
  items: AlertItem[];
}

export function AlertCard({ type, title, items }: AlertCardProps) {
  const isCritical = type === 'critical';
  const totalCount = items.reduce((sum, item) => sum + item.count, 0);

  if (items.length === 0) {
    return null;
  }

  return (
    <Card
      className={cn(
        'border-l-4',
        isCritical
          ? 'border-l-red-500 bg-red-50/50'
          : 'border-l-yellow-500 bg-yellow-50/50'
      )}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center gap-3">
          {isCritical ? (
            <XCircle className="h-6 w-6 text-red-500" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-yellow-500" />
          )}
          <div>
            <p
              className={cn(
                'font-semibold text-lg',
                isCritical ? 'text-red-600' : 'text-yellow-600'
              )}
            >
              {totalCount} {title}
            </p>
            <p className="text-xs text-gray-500">Requires attention</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between py-2 border-t first:border-t-0"
          >
            <span
              className={cn(
                'text-sm font-medium',
                isCritical ? 'text-red-700' : 'text-yellow-700'
              )}
            >
              {item.message} ({item.count})
            </span>
            <span className="text-xs text-gray-400">{item.time}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
