'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  TrendingUp,
  TrendingDown,
  Building,
  Users,
  Coins,
  DollarSign,
  Package,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const iconMap = {
  building: Building,
  users: Users,
  coins: Coins,
  dollarSign: DollarSign,
  package: Package,
  barChart: BarChart3,
} as const;

type IconName = keyof typeof iconMap;

interface StatCardProps {
  iconName: IconName;
  value: number | string;
  label: string;
  subLabel?: string;
  change?: number;
  variant?: 'default' | 'highlight';
  iconBgColor?: string;
  iconColor?: string;
}

export function StatCard({
  iconName,
  value,
  label,
  subLabel,
  change,
  variant = 'default',
  iconBgColor = 'bg-violet-100',
  iconColor = 'text-violet-600',
}: StatCardProps) {
  const Icon = iconMap[iconName];
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
          <Icon
            className={cn('h-5 w-5', isHighlight ? 'text-white' : iconColor)}
          />
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
          {value}
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
