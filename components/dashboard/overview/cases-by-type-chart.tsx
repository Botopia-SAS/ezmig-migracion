'use client';

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface TypeData {
  caseType: string;
  count: number;
}

interface CasesByTypeChartProps {
  data: TypeData[];
  t: (key: string) => string;
  tType: (key: string) => string;
}

const TYPE_COLORS = [
  'hsl(250, 89%, 74%)',  // violet
  'hsl(234, 89%, 74%)',  // indigo
  'hsl(263, 70%, 70%)',  // purple
  'hsl(245, 80%, 70%)',  // blue
  'hsl(270, 70%, 75%)',  // violet light
  'hsl(220, 70%, 70%)',  // blue light
  'hsl(280, 70%, 70%)',  // purple light
  'hsl(200, 70%, 70%)',  // cyan
];

export function CasesByTypeChart({ data, t, tType }: CasesByTypeChartProps) {
  const chartData = data
    .map((item) => ({
      name: tType(item.caseType),
      value: item.count,
      caseType: item.caseType,
    }))
    .sort((a, b) => b.value - a.value); // Sort by count descending

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('charts.casesByType.title')}</CardTitle>
          <CardDescription>{t('charts.casesByType.description')}</CardDescription>
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
        <CardTitle>{t('charts.casesByType.title')}</CardTitle>
        <CardDescription>{t('charts.casesByType.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 0, right: 20, top: 10, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                width={120}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number) => [value, 'Cases']}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={TYPE_COLORS[index % TYPE_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
