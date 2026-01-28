'use client';

import { Bar, BarChart, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DayOfWeekActivity } from '@/lib/tokens/demo-data';

interface ActivityDayChartProps {
  data: DayOfWeekActivity[];
}

const chartConfig = {
  activityCount: {
    label: 'Activities',
    color: 'hsl(var(--chart-4))',
  },
} satisfies ChartConfig;

export function ActivityDayChart({ data }: ActivityDayChartProps) {
  const totalActivity = data.reduce((sum, d) => sum + d.activityCount, 0);
  const peakDay = data.reduce((max, d) => d.activityCount > max.activityCount ? d : max, data[0]);

  // Format data with short day names
  const chartData = data.map(d => ({
    ...d,
    day: d.dayName.slice(0, 3),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity by Day</CardTitle>
        <CardDescription>
          {totalActivity.toLocaleString()} total, peak on {peakDay?.dayName ?? 'N/A'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex items-center justify-center h-[200px] text-muted-foreground">
            No activity data available
          </div>
        ) : (
          <ChartContainer id="activity-day" config={chartConfig} className="h-[200px] w-full">
            <BarChart data={chartData} margin={{ left: 12, right: 12, top: 12, bottom: 12 }}>
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} hide />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) => {
                      const item = payload?.[0]?.payload as DayOfWeekActivity;
                      return item?.dayName ?? '';
                    }}
                  />
                }
              />
              <Bar
                dataKey="activityCount"
                fill="var(--color-activityCount)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
