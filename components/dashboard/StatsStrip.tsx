import { StatCard } from "@/components/dashboard/StatCard";
import { StreakCard } from "@/components/dashboard/StreakCard";

interface StatsStripProps {
  lessonsCompletedThisWeek: number;
  weeklyGoal: number | null;
  totalLessonsCompleted: number;
  streakDays: number;
}

export function StatsStrip({
  lessonsCompletedThisWeek,
  weeklyGoal,
  totalLessonsCompleted,
  streakDays,
}: StatsStripProps) {
  const weeklyValue =
    weeklyGoal != null
      ? `${lessonsCompletedThisWeek} / ${weeklyGoal}`
      : String(lessonsCompletedThisWeek);

  const weeklyZero =
    weeklyGoal != null
      ? `0 / ${weeklyGoal} — first one's the hardest`
      : "0 so far";

  return (
    <div className="grid grid-cols-3 gap-3 max-[480px]:grid-cols-1">
      <StatCard
        label="This week"
        value={weeklyValue}
        zeroText={lessonsCompletedThisWeek === 0 ? weeklyZero : undefined}
      />
      <StatCard
        label="Lessons done"
        value={totalLessonsCompleted}
        zeroText="Day 1"
      />
      <StreakCard streakDays={streakDays} />
    </div>
  );
}
