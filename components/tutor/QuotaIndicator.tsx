"use client";

import { useEffect, useState } from "react";

interface QuotaData {
  usedToday: number;
  dailyCap: number;
}

export default function QuotaIndicator() {
  const [quota, setQuota] = useState<QuotaData | null>(null);

  useEffect(() => {
    fetch("/api/chat/quota")
      .then((r) => r.json())
      .then((data) => setQuota({ usedToday: data.usedToday, dailyCap: data.dailyCap }))
      .catch(() => {});
  }, []);

  if (!quota) return null;

  const ratio = quota.usedToday / quota.dailyCap;
  if (ratio < 0.8) return null;

  const atCap = quota.usedToday >= quota.dailyCap;

  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-md ${
        atCap ? "bg-red-500/10 text-red-400" : "bg-yellow-500/10 text-yellow-400"
      }`}
    >
      {quota.usedToday}/{quota.dailyCap} today
    </span>
  );
}
