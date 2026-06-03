"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";
import { FlameIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StreakCardProps {
  streakDays: number;
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
  const reducedMotion = useReducedMotion();
  const isZero = streakDays === 0;

  return (
    <motion.div
      whileHover={reducedMotion ? undefined : { y: -2 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="transition-shadow duration-200 hover:shadow-md rounded-xl"
    >
      <Card size="sm">
        <CardContent>
          <p className="text-xs text-muted-foreground">Day streak</p>
          <div className="mt-1 flex items-center gap-2">
            <FlameIcon
              className={`size-5 text-orange-500 ${isZero ? "opacity-40" : ""}`}
              style={!isZero ? { animation: "flame-flicker 3s ease-in-out infinite" } : undefined}
              aria-hidden="true"
            />
            <p className="font-mono text-lg tabular-nums">
              {isZero ? "Start today" : <CountUp target={streakDays} />}
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
