"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  // Honor prefers-reduced-motion: drop the slide and shorten the fade.
  const enterDuration = prefersReducedMotion ? 0.15 : 0.3;
  const exitDuration = prefersReducedMotion ? 0.1 : 0.15;
  const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

  const initial = prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 };
  const animate = prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 };
  // Exit with a fast fade only (no y-shift) to avoid layout jank with overlapping elements.
  const exit = { opacity: 0 };

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={pathname}
        layout
        initial={initial}
        animate={{ ...animate, transition: { duration: enterDuration, ease } }}
        exit={{ ...exit, transition: { duration: exitDuration, ease } }}
        className="flex flex-1 flex-col"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
