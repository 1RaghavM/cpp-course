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

export function ActivityHeatmap({ activityData }: ActivityHeatmapProps) {
  const [tooltip, setTooltip] = useState<{ date: string; count: number } | null>(null);
  const weeks = buildGrid(activityData);
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

      {!hasActivity && <p className="mt-3 text-xs text-muted">Your activity will show up here.</p>}
    </GlassCard>
  );
}
