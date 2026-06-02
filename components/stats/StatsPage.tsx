"use client";

import type { StatsResponse } from "@/lib/stats/types";
import { StatNumberCard } from "@/components/stats/StatNumberCard";
import { SuccessRadial } from "@/components/stats/SuccessRadial";
import { WeeklySubmissionsChart } from "@/components/stats/WeeklySubmissionsChart";
import { ChapterProgressChart } from "@/components/stats/ChapterProgressChart";
import { SubmissionBreakdown } from "@/components/stats/SubmissionBreakdown";
import { WeeklyGoalChart } from "@/components/stats/WeeklyGoalChart";
import { EngagementStrip } from "@/components/stats/EngagementStrip";
import { ActivityHeatmap } from "@/components/dashboard/ActivityHeatmap";
import { Flame, Clock } from "lucide-react";

function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

interface StatsPageProps {
  stats: StatsResponse;
}

export function StatsPage({ stats }: StatsPageProps) {
  const lessonPercent =
    stats.totalLessons > 0
      ? Math.round((stats.lessonsCompleted / stats.totalLessons) * 100)
      : 0;

  return (
    <div className="mx-auto w-full max-w-[800px] px-6 py-8">
      <h1 className="mb-6 text-lg font-semibold">Stats</h1>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Row 1: Four stat cards */}
        <StatNumberCard
          label="Lessons Completed"
          value={`${stats.lessonsCompleted} / ${stats.totalLessons}`}
          subtitle={`${lessonPercent}% complete · ${stats.lessonsCompletedThisWeek} this week`}
          progress={{ value: stats.lessonsCompleted, max: stats.totalLessons }}
        />
        <SuccessRadial rate={stats.successRate} />
        <StatNumberCard
          label="Streak"
          value={stats.streakDays}
          subtitle={stats.streakDays === 1 ? "day" : "days"}
          icon={<Flame className="h-4 w-4 text-orange-500" />}
        />
        <StatNumberCard
          label="Time Spent"
          value={formatTime(stats.totalTimeMinutes)}
          subtitle="estimated"
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />

        {/* Row 2: Two wide charts */}
        <div className="sm:col-span-2">
          <WeeklySubmissionsChart data={stats.weeklySubmissions} />
        </div>
        <div className="sm:col-span-2">
          <ChapterProgressChart data={stats.chapterProgress} />
        </div>

        {/* Row 3: Two small + one wide */}
        <SubmissionBreakdown
          passed={stats.passedSubmissions}
          failed={stats.failedSubmissions}
          compileErrors={stats.compileErrors}
        />
        <StatNumberCard
          label="Total Runs"
          value={stats.totalRuns}
          subtitle="code executions"
        />
        <div className="sm:col-span-2">
          <ActivityHeatmap activityData={stats.activityData} />
        </div>

        {/* Row 4: One wide + two small */}
        <div className="sm:col-span-2">
          <WeeklyGoalChart activityData={stats.activityData} weeklyGoal={stats.weeklyGoal} />
        </div>
        <div className="sm:col-span-2">
          <EngagementStrip
            tutorConversations={stats.tutorConversations}
            tutorMessages={stats.tutorMessages}
            notesWritten={stats.notesWritten}
          />
        </div>
      </div>
    </div>
  );
}
