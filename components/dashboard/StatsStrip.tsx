import { StatCard } from "@/components/dashboard/StatCard";

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
  const weeklyValue = weeklyGoal != null
    ? `${lessonsCompletedThisWeek} / ${weeklyGoal}`
    : String(lessonsCompletedThisWeek);

  return (
    <div className="grid grid-cols-3 gap-3 max-[480px]:grid-cols-1">
      <StatCard label="This week" value={weeklyValue} />
      <StatCard label="Lessons done" value={totalLessonsCompleted} />
      <StatCard label="Day streak" value={streakDays} />
    </div>
  );
}
