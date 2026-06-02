"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ActivityHeatmapProps {
  activityData: Record<string, number>;
}

function getIntensityClass(count: number): string {
  if (count === 0) return "bg-muted";
  if (count === 1) return "bg-primary/20";
  if (count <= 3) return "bg-primary/45";
  return "bg-primary/75";
}

function buildGrid(activityData: Record<string, number>): { date: string; count: number }[][] {
  const today = new Date();
  const weeks: { date: string; count: number }[][] = [];

  const dayOfWeek = today.getUTCDay();
  const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const totalDays = 16 * 7;

  const startDate = new Date(today);
  startDate.setUTCDate(startDate.getUTCDate() - totalDays + (6 - adjustedDay));

  let currentWeek: { date: string; count: number }[] = [];

  for (let i = 0; i < totalDays + adjustedDay + 1; i++) {
    const d = new Date(startDate);
    d.setUTCDate(startDate.getUTCDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const dow = d.getUTCDay();
    const mondayBased = dow === 0 ? 6 : dow - 1;

    if (mondayBased === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    if (d <= today) {
      currentWeek.push({ date: dateStr, count: activityData[dateStr] ?? 0 });
    }
  }

  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return weeks;
}

function deriveMonthLabels(
  weeks: { date: string; count: number }[][],
): { weekIndex: number; label: string }[] {
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  const raw: { weekIndex: number; month: number }[] = [];
  let lastMonth = -1;

  for (let wi = 0; wi < weeks.length; wi++) {
    const firstDay = weeks[wi]?.[0];
    if (!firstDay) continue;
    const month = new Date(firstDay.date + "T00:00:00Z").getUTCMonth();
    if (month !== lastMonth) {
      raw.push({ weekIndex: wi, month });
      lastMonth = month;
    }
  }

  return raw
    .filter((entry, i) => {
      const nextStart = raw[i + 1]?.weekIndex ?? weeks.length;
      return nextStart - entry.weekIndex >= 2;
    })
    .map((entry) => ({ weekIndex: entry.weekIndex, label: months[entry.month]! }));
}

export function ActivityHeatmap({ activityData }: ActivityHeatmapProps) {
  const weeks = buildGrid(activityData);
  const monthLabels = deriveMonthLabels(weeks);
  const hasActivity = Object.values(activityData).some((v) => v > 0);

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm">Activity</CardTitle>
      </CardHeader>

      <CardContent>
        <div className="overflow-x-auto">
          <div className="mb-1 flex" style={{ paddingLeft: "28px" }}>
            <div className="flex gap-[3px]">
              {weeks.map((_, wi) => {
                const monthLabel = monthLabels.find((m) => m.weekIndex === wi);
                return (
                  <div key={wi} className="w-3 text-center">
                    {monthLabel ? (
                      <span className="text-[10px] leading-none text-muted-foreground">
                        {monthLabel.label}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="flex flex-col gap-[3px]" style={{ width: "20px" }}>
              {[0, 1, 2, 3, 4, 5, 6].map((row) => (
                <div key={row} className="flex h-3 items-center">
                  {row === 0 ? (
                    <span className="text-[10px] leading-none text-muted-foreground">Mo</span>
                  ) : row === 2 ? (
                    <span className="text-[10px] leading-none text-muted-foreground">We</span>
                  ) : row === 4 ? (
                    <span className="text-[10px] leading-none text-muted-foreground">Fr</span>
                  ) : null}
                </div>
              ))}
            </div>

            <TooltipProvider>
              <div className="flex gap-[3px]">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-[3px]">
                    {week.map((day) => (
                      <Tooltip key={day.date}>
                        <TooltipTrigger
                          className={`h-3 w-3 rounded-sm ${getIntensityClass(day.count)} transition-colors`}
                          aria-label={`${day.date}: ${day.count} actions`}
                        />
                        <TooltipContent side="top">
                          {day.date}: {day.count} {day.count === 1 ? "action" : "actions"}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                ))}
              </div>
            </TooltipProvider>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-end gap-1.5">
          <span className="text-[10px] text-muted-foreground">Less</span>
          {["bg-muted", "bg-primary/20", "bg-primary/45", "bg-primary/75"].map((cls) => (
            <div key={cls} className={`h-2.5 w-2.5 rounded-sm ${cls}`} />
          ))}
          <span className="text-[10px] text-muted-foreground">More</span>
        </div>

        {!hasActivity && (
          <p className="mt-3 text-xs text-muted-foreground">Your activity will show up here.</p>
        )}
      </CardContent>
    </Card>
  );
}
