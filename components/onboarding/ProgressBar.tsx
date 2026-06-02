"use client";

import { motion } from "framer-motion";

type ProgressBarProps = {
  current: number;
  total: number;
};

export function ProgressBar({ current, total }: ProgressBarProps) {
  return (
    <div className="ob-progress">
      <span className="ob-progress-text">
        {current} / {total}
      </span>
      <div className="ob-progress-track">
        <motion.div
          className="ob-progress-fill"
          initial={{ width: 0 }}
          animate={{ width: `${(current / total) * 100}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
