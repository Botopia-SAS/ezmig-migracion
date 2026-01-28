'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TokenFlowPoint } from '@/lib/tokens/demo-data';

interface TokenFlowChartProps {
  data: TokenFlowPoint[];
}

const chartConfig = {
  tokensIn: {
    label: 'Tokens In',
    color: 'hsl(var(--chart-2))',
  },
  tokensOut: {
    label: 'Tokens Out',
    color: 'hsl(var(--chart-3))',
  },
} satisfies ChartConfig;

export function TokenFlowChart({ data }: TokenFlowChartProps) {
  const totalIn = data.reduce((sum, d) => sum + d.tokensIn, 0);
  const totalOut = data.reduce((sum, d) => sum + d.tokensOut, 0);
  const netFlow = totalIn - totalOut;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Flow</CardTitle>
        <CardDescription>
          Net flow: {netFlow >= 0 ? '+' : ''}{netFlow.toLocaleString()} tokens (14 days)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length < 3 ? (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            Insufficient data to display trends
          </div>
        ) : (
          <ChartContainer id="token-flow" config={chartConfig} className="h-[250px] w-full">
            <BarChart data={data} margin={{ left: 12, right: 12, top: 12, bottom: 12 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => value.slice(8)}
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
              <Bar dataKey="tokensIn" fill="var(--color-tokensIn)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="tokensOut" fill="var(--color-tokensOut)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
