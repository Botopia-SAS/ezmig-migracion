'use client';

import { PolarAngleAxis, RadialBar, RadialBarChart } from 'recharts';
import {
  ChartContainer,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { EngagementMetrics } from '@/lib/tokens/demo-data';

interface EngagementRadialProps {
  data: EngagementMetrics;
}

const chartConfig = {
  autoReload: {
    label: 'Auto-reload',
    color: 'hsl(var(--chart-1))',
  },
  repeatPurchase: {
    label: 'Repeat Buyers',
    color: 'hsl(var(--chart-2))',
  },
  active: {
    label: 'Active (7d)',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;

export function EngagementRadial({ data }: EngagementRadialProps) {
  const chartData = [
    {
      name: 'Auto-reload',
      value: data.autoReloadAdoptionRate,
      fill: 'var(--color-autoReload)',
    },
    {
      name: 'Repeat Buyers',
      value: data.repeatPurchaseRate,
      fill: 'var(--color-repeatPurchase)',
    },
    {
      name: 'Active (7d)',
      value: data.activeTenantsRate,
      fill: 'var(--color-active)',
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Engagement</CardTitle>
        <CardDescription>
          {data.totalTenantsWithWallet} tenants with wallets
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        <ChartContainer id="engagement-radial" config={chartConfig} className="mx-auto h-[200px] w-full max-w-[200px]">
          <RadialBarChart
            data={chartData}
            startAngle={180}
            endAngle={0}
            innerRadius="30%"
            outerRadius="100%"
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              dataKey="value"
              cornerRadius={4}
              background={{ fill: 'hsl(var(--muted))' }}
            />
          </RadialBarChart>
        </ChartContainer>

        {/* Legend */}
        <div className="mt-2 space-y-2">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.fill }}
                />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
              <span className="font-medium">{item.value}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
