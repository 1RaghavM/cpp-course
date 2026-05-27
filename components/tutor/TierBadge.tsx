"use client";

const TIERS: Record<number, { label: string; color: string; description: string }> = {
  1: {
    label: "T1 · Guiding",
    color: "bg-accent/20 text-accent border-accent/30",
    description: "Asking guiding questions — no solution hints",
  },
  2: {
    label: "T2 · Concept",
    color: "bg-warning/20 text-warning border-warning/30",
    description: "Naming the missing concept — no code",
  },
  3: {
    label: "T3 · Approach",
    color: "bg-warning/20 text-warning border-warning/30",
    description: "Sketching the approach — pseudocode only",
  },
  4: {
    label: "T4 · Solution",
    color: "bg-success/20 text-success border-success/30",
    description: "Showing a working snippet with explanation",
  },
};

export default function TierBadge({ tier }: { tier: number }) {
  const t = TIERS[tier] ?? TIERS[1]!;

  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${t.color}`}
      title={t.description}
    >
      {t.label}
    </span>
  );
}
