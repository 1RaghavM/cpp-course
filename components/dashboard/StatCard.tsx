interface StatCardProps {
  label: string;
  value: number | string;
  suffix?: string;
}

export function StatCard({ label, value, suffix }: StatCardProps) {
  return (
    <div className="rounded-lg bg-elevated p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-mono text-lg tabular-nums text-primary">
        {value}
        {suffix && <span className="text-sm text-muted"> {suffix}</span>}
      </p>
    </div>
  );
}
