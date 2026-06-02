"use client";

import { Label, PolarGrid, RadialBar, RadialBarChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";

const chartConfig = {
  rate: {
    label: "Success Rate",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

interface SuccessRadialProps {
  rate: number;
}

export function SuccessRadial({ rate }: SuccessRadialProps) {
  const percent = Math.round(rate * 100);
  const data = [{ name: "rate", value: percent, fill: "var(--color-rate)" }];

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm">Success Rate</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[140px]">
          <RadialBarChart
            data={data}
            startAngle={90}
            endAngle={90 + 360 * (percent / 100)}
            innerRadius={50}
            outerRadius={70}
          >
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              polarRadius={[54, 46]}
              className="first:fill-muted last:fill-background"
            />
            <RadialBar dataKey="value" background cornerRadius={10} />
            <Label
              content={() => (
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                  <tspan className="fill-foreground text-2xl font-bold">{percent}%</tspan>
                </text>
              )}
            />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
