import { clearOnboardingState, getOnboardingPayload } from "./storage";

export type OnboardingSyncResult =
  | { status: "noop" }
  | { status: "applied" }
  | { status: "already_complete" }
  | { status: "unauthorized" }
  | { status: "error" };

/**
 * Persist a completed questionnaire from localStorage.
 *
 * Existing accounts keep their saved row — leftover browser state from another
 * session is discarded instead of overwriting. First-time accounts POST the
 * draft and clear storage.
 */
export async function syncOnboardingFromStorage(
  signal?: AbortSignal,
): Promise<OnboardingSyncResult> {
  const payload = getOnboardingPayload();
  if (!payload) return { status: "noop" };

  let existing: Response;
  try {
    existing = await fetch("/api/onboarding", { signal });
  } catch {
    return { status: "error" };
  }

  if (signal?.aborted) return { status: "error" };

  if (existing.status === 401) return { status: "unauthorized" };

  if (existing.ok) {
    clearOnboardingState();
    return { status: "already_complete" };
  }

  if (existing.status !== 404) return { status: "error" };

  let saved: Response;
  try {
    saved = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
  } catch {
    return { status: "error" };
  }

  if (signal?.aborted) return { status: "error" };
  if (!saved.ok) return { status: "error" };

  clearOnboardingState();
  return { status: "applied" };
}

/** Always upsert the current draft (logged-in user finishing the wizard). */
export async function saveOnboardingPayload(signal?: AbortSignal): Promise<OnboardingSyncResult> {
  const payload = getOnboardingPayload();
  if (!payload) return { status: "noop" };

  let saved: Response;
  try {
    saved = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
  } catch {
    return { status: "error" };
  }

  if (signal?.aborted) return { status: "error" };
  if (saved.status === 401) return { status: "unauthorized" };
  if (!saved.ok) return { status: "error" };

  clearOnboardingState();
  return { status: "applied" };
}
