"use client";

import { type ReactNode, useEffect } from "react";
import { StatsigProvider } from "@statsig/react-bindings";
import { StatsigAutoCapturePlugin } from "@statsig/web-analytics";
import { useClientAsyncInit } from "@statsig/react-bindings";
import type { StatsigUser } from "@statsig/client-core";
import { setStatsigClient } from "@/lib/statsig/track";

function getEnvironmentTier(): string {
  const env = process.env.NEXT_PUBLIC_VERCEL_ENV;
  if (env === "production") return "production";
  if (env === "preview") return "staging";
  return "development";
}

export function StatsigProviderWrapper({
  user,
  children,
}: {
  user: StatsigUser;
  children: ReactNode;
}) {
  const sdkKey = process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY ?? "";

  const { client, isLoading } = useClientAsyncInit(sdkKey, user, {
    environment: { tier: getEnvironmentTier() },
    plugins: [new StatsigAutoCapturePlugin()],
  });

  useEffect(() => {
    if (!isLoading) {
      setStatsigClient(client);
    }
  }, [client, isLoading]);

  if (isLoading) {
    return <>{children}</>;
  }

  return <StatsigProvider client={client}>{children}</StatsigProvider>;
}
