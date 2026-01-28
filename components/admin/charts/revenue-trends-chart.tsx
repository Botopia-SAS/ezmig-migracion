'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RevenueTimeSeriesPoint } from '@/lib/tokens/demo-data';

interface RevenueTrendsChartProps {
  data: RevenueTimeSeriesPoint[];
}

const chartConfig = {
  estimatedRevenue: {
    label: 'Revenue ($)',
    color: 'hsl(var(--chart-1))',
  },
  tokensSold: {
    label: 'Tokens Sold',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export function RevenueTrendsChart({ data }: RevenueTrendsChartProps) {
  const totalRevenue = data.reduce((sum, d) => sum + d.estimatedRevenue, 0);
  const totalTokens = data.reduce((sum, d) => sum + d.tokensSold, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Trends</CardTitle>
        <CardDescription>
          Last 30 days: ${totalRevenue.toLocaleString()} revenue, {totalTokens.toLocaleString()} tokens sold
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length < 5 ? (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            Insufficient data to display trends
          </div>
        ) : (
          <ChartContainer id="revenue-trends" config={chartConfig} className="h-[300px] w-full">
            <AreaChart data={data} margin={{ left: 12, right: 12, top: 12, bottom: 12 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(5)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `$${value}`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      });
                    }}
                  />
                }
              />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey="estimatedRevenue"
                fill="var(--color-estimatedRevenue)"
                fillOpacity={0.4}
                stroke="var(--color-estimatedRevenue)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
