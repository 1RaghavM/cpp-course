"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface QuotaData {
  usedToday: number;
  dailyCap: number;
}

export default function QuotaIndicator({ refreshKey = 0 }: { refreshKey?: number }) {
  const [quota, setQuota] = useState<QuotaData | null>(null);

  useEffect(() => {
    fetch("/api/chat/quota")
      .then((r) => r.json())
      .then((data) => setQuota({ usedToday: data.usedToday, dailyCap: data.dailyCap }))
      .catch(() => {});
  }, [refreshKey]);

  if (!quota) return null;

  const ratio = quota.usedToday / quota.dailyCap;
  if (ratio < 0.8) return null;

  const atCap = quota.usedToday >= quota.dailyCap;

  return (
    <Badge
      variant={atCap ? "destructive" : "secondary"}
      className={atCap ? "bg-error/10 text-error" : "bg-warning/10 text-warning"}
    >
      {quota.usedToday}/{quota.dailyCap} today
    </Badge>
  );
}
