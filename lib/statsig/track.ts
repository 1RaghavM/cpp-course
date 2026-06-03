import { StatsigClient } from "@statsig/js-client";

import type { EventMap, EventName } from "@/lib/statsig/events";

let client: StatsigClient | null = null;

export function setStatsigClient(instance: StatsigClient): void {
  client = instance;
}

function stringifyMetadata(metadata: Record<string, unknown>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(metadata)) {
    result[key] = String(value);
  }
  return result;
}

export function trackEvent<K extends EventName>(name: K, metadata: EventMap[K]): void {
  if (!client) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[statsig:no-client] ${name}`, metadata);
    }
    return;
  }

  client.logEvent(name, undefined, stringifyMetadata(metadata as Record<string, unknown>));
}
