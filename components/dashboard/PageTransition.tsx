"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  // Honor prefers-reduced-motion: drop the slide and shorten the fade.
  const initial = prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 };
  const animate = prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 };
  const exit = prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 };
  const duration = prefersReducedMotion ? 0.15 : 0.3;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={initial}
        animate={animate}
        exit={exit}
        transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-1 flex-col"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
