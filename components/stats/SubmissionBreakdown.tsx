"use client";

import { Pie, PieChart, Label } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const chartConfig = {
  count: { label: "Count" },
  passed: { label: "Passed", color: "var(--chart-1)" },
  failed: { label: "Failed", color: "var(--chart-2)" },
  compileError: { label: "Compile Error", color: "var(--chart-4)" },
} satisfies ChartConfig;

interface SubmissionBreakdownProps {
  passed: number;
  failed: number;
  compileErrors: number;
}

export function SubmissionBreakdown({ passed, failed, compileErrors }: SubmissionBreakdownProps) {
  const total = passed + failed + compileErrors;
  const data = [
    { name: "passed", count: passed, fill: "var(--color-passed)" },
    { name: "failed", count: failed, fill: "var(--color-failed)" },
    { name: "compileError", count: compileErrors, fill: "var(--color-compileError)" },
  ];

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm">Submissions</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[140px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
            <Pie data={data} dataKey="count" nameKey="name" innerRadius={40} outerRadius={60} strokeWidth={2}>
              <Label
                content={() => (
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                    <tspan className="fill-foreground text-xl font-bold">{total}</tspan>
                    <tspan className="fill-muted-foreground text-xs" x="50%" dy="16">
                      total
                    </tspan>
                  </text>
                )}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
