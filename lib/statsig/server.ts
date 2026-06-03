import Statsig, { type StatsigUser } from "statsig-node";

let initPromise: Promise<void> | null = null;

function getEnvironmentTier(): string {
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV;
  if (env === "production") return "production";
  if (env === "preview") return "staging";
  return "development";
}

export async function getServerStatsig(): Promise<typeof Statsig> {
  if (!initPromise) {
    const secretKey = process.env.STATSIG_SERVER_SECRET_KEY;
    if (!secretKey) {
      throw new Error("Missing STATSIG_SERVER_SECRET_KEY environment variable");
    }

    initPromise = Statsig.initialize(secretKey, {
      environment: { tier: getEnvironmentTier() },
    }).then(() => undefined);
  }

  await initPromise;
  return Statsig;
}

export async function serverLogEvent(
  user: StatsigUser,
  eventName: string,
  value?: string | number | null,
  metadata?: Record<string, string> | null,
): Promise<void> {
  const statsig = await getServerStatsig();
  statsig.logEvent(user, eventName, value, metadata);
}
