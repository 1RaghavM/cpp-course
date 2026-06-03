"use client";

import { motion, useReducedMotion } from "motion/react";
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
  const reducedMotion = useReducedMotion();

  const weeklyValue =
    weeklyGoal != null
      ? `${lessonsCompletedThisWeek} / ${weeklyGoal}`
      : String(lessonsCompletedThisWeek);

  const weeklyZero =
    weeklyGoal != null ? `0 / ${weeklyGoal} — first one's the hardest` : "0 so far";

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = reducedMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 8 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.32,
            ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
          },
        },
      };

  return (
    <motion.div
      className="grid grid-cols-3 gap-3 max-[480px]:grid-cols-1"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <StatCard
          label="This week"
          value={weeklyValue}
          zeroText={lessonsCompletedThisWeek === 0 ? weeklyZero : undefined}
        />
      </motion.div>
      <motion.div variants={itemVariants}>
        <StatCard label="Lessons done" value={totalLessonsCompleted} zeroText="Day 1" />
      </motion.div>
      <motion.div variants={itemVariants}>
        <StreakCard streakDays={streakDays} />
      </motion.div>
    </motion.div>
  );
}
