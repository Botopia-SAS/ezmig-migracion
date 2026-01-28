'use client';

import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { GrowthTimeSeriesPoint } from '@/lib/tokens/demo-data';

interface GrowthChartProps {
  userData: GrowthTimeSeriesPoint[];
  tenantData: GrowthTimeSeriesPoint[];
}

const chartConfig = {
  users: {
    label: 'Users',
    color: 'hsl(var(--chart-1))',
  },
  tenants: {
    label: 'Tenants',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export function GrowthChart({ userData, tenantData }: GrowthChartProps) {
  // Merge data by date
  const mergedData = userData.map((user, index) => ({
    date: user.date,
    users: user.cumulativeCount,
    tenants: tenantData[index]?.cumulativeCount ?? 0,
  }));

  const latestUsers = userData[userData.length - 1]?.cumulativeCount ?? 0;
  const latestTenants = tenantData[tenantData.length - 1]?.cumulativeCount ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Platform Growth</CardTitle>
        <CardDescription>
          {latestUsers.toLocaleString()} users, {latestTenants.toLocaleString()} tenants
        </CardDescription>
      </CardHeader>
      <CardContent>
        {mergedData.length < 5 ? (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            Insufficient data to display trends
          </div>
        ) : (
          <ChartContainer id="growth-chart" config={chartConfig} className="h-[250px] w-full">
            <LineChart data={mergedData} margin={{ left: 12, right: 12, top: 12, bottom: 12 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(5)}
                interval="preserveStartEnd"
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} />
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
              <Line
                type="monotone"
                dataKey="users"
                stroke="var(--color-users)"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="tenants"
                stroke="var(--color-tenants)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
