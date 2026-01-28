'use client';

import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { PackagePerformanceData } from '@/lib/tokens/demo-data';

interface PackagePerformanceChartProps {
  data: PackagePerformanceData[];
}

const chartConfig = {
  purchaseCount: {
    label: 'Purchases',
    color: 'hsl(var(--chart-1))',
  },
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--chart-4))',
  },
} satisfies ChartConfig;

export function PackagePerformanceChart({ data }: PackagePerformanceChartProps) {
  const totalPurchases = data.reduce((sum, d) => sum + d.purchaseCount, 0);
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

  // Format data for chart (show revenue in dollars)
  const chartData = data.map(d => ({
    ...d,
    revenueInDollars: d.revenue / 100,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Package Performance</CardTitle>
        <CardDescription>
          {totalPurchases.toLocaleString()} purchases, ${(totalRevenue / 100).toLocaleString()} revenue
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No package data available
          </div>
        ) : (
          <ChartContainer id="package-performance" config={chartConfig} className="h-[200px] w-full">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ left: 12, right: 12, top: 12, bottom: 12 }}
            >
              <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={80}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      if (name === 'purchaseCount') return `${value} purchases`;
                      return value;
                    }}
                  />
                }
              />
              <Bar
                dataKey="purchaseCount"
                fill="var(--color-purchaseCount)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
