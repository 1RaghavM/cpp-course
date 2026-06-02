"use client";

import { motion } from "framer-motion";

type OptionCardProps = {
  label: string;
  description?: string;
  selected?: boolean;
  onSelect: () => void;
};

export function OptionCard({ label, description, selected, onSelect }: OptionCardProps) {
  return (
    <motion.button
      type="button"
      className="ob-option-card"
      data-selected={selected || undefined}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <span className="ob-option-label">{label}</span>
      {description ? <span className="ob-option-desc">{description}</span> : null}
    </motion.button>
  );
}
