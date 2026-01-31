'use client';

import { Pie, PieChart, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface StatusData {
  status: string;
  count: number;
}

interface CasesByStatusChartProps {
  data: StatusData[];
  t: (key: string) => string;
  tStatus: (key: string) => string;
}

const STATUS_COLORS: Record<string, string> = {
  intake: '#9CA3AF',       // gray-400
  in_progress: '#3B82F6',  // blue-500
  submitted: '#F59E0B',    // amber-500
  approved: '#10B981',     // emerald-500
  denied: '#EF4444',       // red-500
  on_hold: '#8B5CF6',      // violet-500
  closed: '#6B7280',       // gray-500
};

export function CasesByStatusChart({ data, t, tStatus }: CasesByStatusChartProps) {
  const chartData = data.map((item) => ({
    name: tStatus(item.status),
    value: item.count,
    status: item.status,
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('charts.casesByStatus.title')}</CardTitle>
          <CardDescription>{t('charts.casesByStatus.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('charts.casesByStatus.title')}</CardTitle>
        <CardDescription>{t('charts.casesByStatus.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={STATUS_COLORS[entry.status] || '#9CA3AF'}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [value, 'Cases']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-3 mt-4 justify-center">
          {chartData.map((item) => (
            <div key={item.status} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[item.status] || '#9CA3AF' }}
              />
              <span className="text-sm text-muted-foreground">
                {item.name}: {item.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
