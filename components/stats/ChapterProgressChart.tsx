"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChapterProgressEntry } from "@/lib/stats/types";

const chartConfig = {
  completed: {
    label: "Completed",
    color: "var(--chart-1)",
  },
  remaining: {
    label: "Remaining",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

interface ChapterProgressChartProps {
  data: ChapterProgressEntry[];
}

export function ChapterProgressChart({ data }: ChapterProgressChartProps) {
  const chartData = data.map((ch) => ({
    name: ch.chapterTitle.length > 20 ? ch.chapterTitle.slice(0, 20) + "..." : ch.chapterTitle,
    completed: ch.completed,
    remaining: ch.total - ch.completed,
  }));

  const chartHeight = Math.max(200, chartData.length * 28);

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm">Chapter Progress</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          <ChartContainer config={chartConfig} className="w-full" style={{ height: chartHeight }}>
            <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{ left: 0 }}>
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                width={100}
                tick={{ fontSize: 11 }}
              />
              <XAxis type="number" hide />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="completed" stackId="a" fill="var(--color-completed)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="remaining" stackId="a" fill="var(--color-remaining)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
