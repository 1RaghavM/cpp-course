"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useSpring, useReducedMotion } from "motion/react";
import { GlassCard } from "@/components/ui/GlassCard";

interface StreakCardProps {
  streakDays: number;
}

function FlameIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`inline-block h-5 w-5 text-streak ${active ? "flame-flicker" : "opacity-40"}`}
      style={active ? { animation: "flame-flicker 3s ease-in-out infinite" } : undefined}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 23c-3.866 0-7-3.134-7-7 0-2.692 1.475-5.598 3.434-8.12a.75.75 0 011.232.028C11.01 9.817 12 11.7 12 11.7s2.25-3.6 3.75-5.4a.75.75 0 011.248.06C18.664 9.1 19 12.05 19 16c0 3.866-3.134 7-7 7z" />
    </svg>
  );
}

function CountUp({ target }: { target: number }) {
  const reducedMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, { duration: 560, bounce: 0 });

  useEffect(() => {
    if (reducedMotion) {
      if (ref.current) ref.current.textContent = String(target);
      return;
    }
    motionVal.set(target);
    const unsubscribe = springVal.on("change", (v) => {
      if (ref.current) ref.current.textContent = String(Math.round(v));
    });
    return unsubscribe;
  }, [target, motionVal, springVal, reducedMotion]);

  return <span ref={ref}>{reducedMotion ? target : 0}</span>;
}

export function StreakCard({ streakDays }: StreakCardProps) {
  const isZero = streakDays === 0;

  return (
    <GlassCard className="p-4">
      <p className="text-xs text-muted">Day streak</p>
      <div className="mt-1 flex items-center gap-2">
        <FlameIcon active={!isZero} />
        <p className="font-mono text-lg tabular-nums text-primary">
          {isZero ? "Start today" : <CountUp target={streakDays} />}
        </p>
      </div>
    </GlassCard>
  );
}
