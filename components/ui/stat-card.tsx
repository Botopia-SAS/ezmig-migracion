'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  subLabel?: string;
  change?: number;
  variant?: 'default' | 'highlight';
  iconBgColor?: string;
}

export function StatCard({
  icon,
  value,
  label,
  subLabel,
  change,
  variant = 'default',
  iconBgColor = 'bg-violet-100',
}: StatCardProps) {
  const isHighlight = variant === 'highlight';

  return (
    <Card
      className={cn(
        'transition-shadow hover:shadow-md',
        isHighlight && 'bg-gradient-to-br from-gray-800 to-gray-900 text-white border-0'
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div
          className={cn(
            'p-2 rounded-lg',
            isHighlight ? 'bg-white/10' : iconBgColor
          )}
        >
          {icon}
        </div>
        {change !== undefined && (
          <div
            className={cn(
              'flex items-center gap-1 text-sm font-medium',
              change >= 0 ? 'text-green-500' : 'text-red-500'
            )}
          >
            {change >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span>
              {change >= 0 ? '+' : ''}
              {change}%
            </span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            'text-3xl font-bold',
            isHighlight ? 'text-white' : 'text-gray-900'
          )}
        >
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        <p
          className={cn(
            'text-sm mt-1',
            isHighlight ? 'text-gray-300' : 'text-gray-500'
          )}
        >
          {label}
        </p>
        {subLabel && (
          <p
            className={cn(
              'text-xs mt-0.5',
              isHighlight ? 'text-violet-300' : 'text-violet-500'
            )}
          >
            {subLabel}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
