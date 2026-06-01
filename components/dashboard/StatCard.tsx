import { GlassCard } from "@/components/ui/GlassCard";

interface StatCardProps {
  label: string;
  value: number | string;
  suffix?: string;
  zeroText?: string;
}

export function StatCard({ label, value, suffix, zeroText }: StatCardProps) {
  const isZero = value === 0 || value === "0";
  const displayValue = isZero && zeroText ? zeroText : value;

  return (
    <GlassCard className="p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-mono text-lg tabular-nums text-primary">
        {displayValue}
        {!isZero && suffix && <span className="text-sm text-muted"> {suffix}</span>}
      </p>
    </GlassCard>
  );
}
