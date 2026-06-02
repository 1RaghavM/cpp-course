"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  completed: {
    label: "Completed",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface WeeklyGoalChartProps {
  activityData: Record<string, number>;
  weeklyGoal: number | null;
}

function groupByWeek(activityData: Record<string, number>): { week: string; completed: number }[] {
  const weekMap = new Map<string, number>();

  for (const [dateStr, count] of Object.entries(activityData)) {
    const d = new Date(dateStr + "T00:00:00Z");
    const dayOfWeek = d.getUTCDay();
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(d);
    monday.setUTCDate(monday.getUTCDate() - daysSinceMonday);
    const weekKey = monday.toISOString().slice(0, 10);
    weekMap.set(weekKey, (weekMap.get(weekKey) ?? 0) + count);
  }

  return Array.from(weekMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, completed]) => ({ week, completed }));
}

export function WeeklyGoalChart({ activityData, weeklyGoal }: WeeklyGoalChartProps) {
  const data = groupByWeek(activityData);

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm">Weekly Goal Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <AreaChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="week"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(v: string) => {
                const d = new Date(v + "T00:00:00Z");
                return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
              }}
            />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {weeklyGoal != null && (
              <ReferenceLine
                y={weeklyGoal}
                stroke="var(--muted-foreground)"
                strokeDasharray="4 4"
                label={{ value: "Goal", position: "insideTopRight", fontSize: 11 }}
              />
            )}
            <Area
              dataKey="completed"
              type="monotone"
              fill="var(--color-completed)"
              fillOpacity={0.3}
              stroke="var(--color-completed)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
