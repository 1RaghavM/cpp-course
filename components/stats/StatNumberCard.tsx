"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface StatNumberCardProps {
  label: string;
  value: number | string;
  subtitle?: string;
  progress?: { value: number; max: number };
  icon?: React.ReactNode;
}

export function StatNumberCard({ label, value, subtitle, progress: prog, icon }: StatNumberCardProps) {
  const percent = prog ? Math.round((prog.value / prog.max) * 100) : null;

  return (
    <Card size="sm">
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{label}</p>
          {icon}
        </div>
        <p className="mt-1 font-mono text-2xl font-semibold tabular-nums">{value}</p>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        {percent !== null && (
          <Progress value={percent} className="mt-2 h-1.5" />
        )}
      </CardContent>
    </Card>
  );
}
