"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";

interface ActivityHeatmapProps {
  activityData: Record<string, number>;
}

function getIntensityClass(count: number): string {
  if (count === 0) return "bg-[var(--bg-elevated)]";
  if (count === 1) return "bg-brand-bright/20";
  if (count <= 3) return "bg-brand-bright/45";
  return "bg-brand-bright/75";
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
  const [tooltip, setTooltip] = useState<{ date: string; count: number } | null>(null);
  const weeks = buildGrid(activityData);
  const monthLabels = deriveMonthLabels(weeks);
  const hasActivity = Object.values(activityData).some((v) => v > 0);

  return (
    <GlassCard className="p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium text-primary">Activity</h3>
        {tooltip && (
          <span className="text-xs text-secondary">
            {tooltip.date}: {tooltip.count} {tooltip.count === 1 ? "action" : "actions"}
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        {/* Month labels row */}
        <div className="mb-1 flex" style={{ paddingLeft: "28px" }}>
          <div className="flex gap-[3px]">
            {weeks.map((_, wi) => {
              const monthLabel = monthLabels.find((m) => m.weekIndex === wi);
              return (
                <div key={wi} className="w-3 text-center">
                  {monthLabel ? (
                    <span className="text-[10px] leading-none text-muted">
                      {monthLabel.label}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Grid with weekday labels */}
        <div className="flex gap-2">
          {/* Weekday labels */}
          <div className="flex flex-col gap-[3px]" style={{ width: "20px" }}>
            {[0, 1, 2, 3, 4, 5, 6].map((row) => (
              <div key={row} className="flex h-3 items-center">
                {row === 0 ? (
                  <span className="text-[10px] leading-none text-muted">Mo</span>
                ) : row === 2 ? (
                  <span className="text-[10px] leading-none text-muted">We</span>
                ) : row === 4 ? (
                  <span className="text-[10px] leading-none text-muted">Fr</span>
                ) : null}
              </div>
            ))}
          </div>

          {/* Heatmap cells */}
          <div className="flex gap-[3px]">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((day) => (
                  <button
                    key={day.date}
                    type="button"
                    className={`h-3 w-3 rounded-sm ${getIntensityClass(day.count)} transition-colors duration-fast`}
                    onMouseEnter={() => setTooltip(day)}
                    onFocus={() => setTooltip(day)}
                    onMouseLeave={() => setTooltip(null)}
                    onBlur={() => setTooltip(null)}
                    aria-label={`${day.date}: ${day.count} actions`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Intensity legend */}
      <div className="mt-3 flex items-center justify-end gap-1.5">
        <span className="text-[10px] text-muted">Less</span>
        {[
          "bg-[var(--bg-elevated)]",
          "bg-brand-bright/20",
          "bg-brand-bright/45",
          "bg-brand-bright/75",
        ].map((cls) => (
          <div key={cls} className={`h-2.5 w-2.5 rounded-sm ${cls}`} />
        ))}
        <span className="text-[10px] text-muted">More</span>
      </div>

      {!hasActivity && <p className="mt-3 text-xs text-muted">Your activity will show up here.</p>}
    </GlassCard>
  );
}
