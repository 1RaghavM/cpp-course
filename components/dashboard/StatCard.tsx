"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: number | string;
  suffix?: string;
  zeroText?: string;
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

export function StatCard({ label, value, suffix, zeroText }: StatCardProps) {
  const reducedMotion = useReducedMotion();
  const isZero = value === 0 || value === "0";

  return (
    <motion.div
      whileHover={reducedMotion ? undefined : { y: -2 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="transition-shadow duration-200 hover:shadow-md rounded-xl"
    >
      <Card size="sm">
        <CardContent>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 font-mono text-lg tabular-nums">
            {isZero && zeroText ? (
              zeroText
            ) : typeof value === "number" ? (
              <>
                <CountUp target={value} />
                {suffix && <span className="text-sm text-muted-foreground"> {suffix}</span>}
              </>
            ) : (
              <>
                {value}
                {suffix && <span className="text-sm text-muted-foreground"> {suffix}</span>}
              </>
            )}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
