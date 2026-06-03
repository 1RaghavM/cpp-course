import { StatsigClient } from "@statsig/js-client";
import { StatsigAutoCapturePlugin } from "@statsig/web-analytics";

let client: StatsigClient | null = null;

function getEnvironmentTier(): string {
  const env = process.env.NEXT_PUBLIC_VERCEL_ENV;
  if (env === "production") return "production";
  if (env === "preview") return "staging";
  return "development";
}

export function getStatsigClient(user: { userID?: string; customIDs?: Record<string, string> } = {}): StatsigClient {
  if (client) return client;

  const sdkKey = process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY;
  if (!sdkKey) {
    throw new Error("Missing NEXT_PUBLIC_STATSIG_CLIENT_KEY environment variable");
  }

  client = new StatsigClient(sdkKey, user, {
    environment: { tier: getEnvironmentTier() },
    plugins: [new StatsigAutoCapturePlugin()],
  });

  return client;
}
