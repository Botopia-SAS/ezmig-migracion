'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TransactionTypeBreakdown {
  type: string;
  count: number;
  total: number;
  percentage: number;
}

interface TransactionsChartProps {
  breakdown: TransactionTypeBreakdown[];
  total: number;
}

const typeConfig: Record<
  string,
  { label: string; color: string; bgColor: string }
> = {
  purchase: {
    label: 'Purchases',
    color: 'bg-green-500',
    bgColor: 'bg-green-500',
  },
  consumption: {
    label: 'Consumption',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-500',
  },
  auto_reload: {
    label: 'Auto-reload',
    color: 'bg-orange-500',
    bgColor: 'bg-orange-500',
  },
  bonus: {
    label: 'Bonus',
    color: 'bg-purple-500',
    bgColor: 'bg-purple-500',
  },
  refund: {
    label: 'Refunds',
    color: 'bg-gray-400',
    bgColor: 'bg-gray-400',
  },
};

export function TransactionsChart({ breakdown, total }: TransactionsChartProps) {
  // Sort by count descending
  const sortedBreakdown = [...breakdown].sort((a, b) => b.count - a.count);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Transactions by Type</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Stacked progress bar */}
        <div className="h-4 w-full rounded-full overflow-hidden flex bg-gray-100">
          {sortedBreakdown.map((item) => {
            const config = typeConfig[item.type] || {
              label: item.type,
              color: 'bg-gray-300',
              bgColor: 'bg-gray-300',
            };
            return (
              <div
                key={item.type}
                className={cn(config.bgColor, 'transition-all')}
                style={{ width: `${item.percentage}%` }}
                title={`${config.label}: ${item.count} (${item.percentage}%)`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 space-y-3">
          {sortedBreakdown.map((item) => {
            const config = typeConfig[item.type] || {
              label: item.type,
              color: 'bg-gray-300',
              bgColor: 'bg-gray-300',
            };
            return (
              <div key={item.type} className="flex items-center gap-3">
                <div className={cn('w-3 h-3 rounded-full', config.bgColor)} />
                <span className="flex-1 text-sm text-gray-600">
                  {config.label}
                </span>
                <span className="font-semibold text-gray-900">{item.count}</span>
              </div>
            );
          })}
        </div>

        {/* Total */}
        <div className="mt-4 pt-4 border-t flex justify-between items-center">
          <span className="text-gray-500">Total transactions</span>
          <span className="text-xl font-bold text-gray-900">{total}</span>
        </div>
      </CardContent>
    </Card>
  );
}
