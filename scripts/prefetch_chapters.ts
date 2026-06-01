/**
 * prefetch_chapters.ts — Warm lesson cache for selected chapters via the HTTP API.
 *
 * Mirrors a first visit to each lesson (GET /api/lessons/[slug] on cache miss).
 * Lessons are processed from a global queue with concurrency caps. Each lesson
 * triggers ~2 Sonnet API calls (summary + exercises), so starts are limited to
 * stay under Anthropic's 50 req/min org limit.
 *
 * Usage:
 *   npm run dev   # in another terminal
 *   npx tsx scripts/prefetch_chapters.ts
 *   npx tsx scripts/prefetch_chapters.ts --chapters 14,15,16
 *   npx tsx scripts/prefetch_chapters.ts --base-url https://your-app.vercel.app
 *
 * Requires .env.local (or env):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 *   CPPROAD_EMAIL          — owner account email (sign-in)
 *   CPPROAD_PASSWORD       — owner account password
 *
 * Optional:
 *   CPPROAD_BASE_URL       — default http://localhost:3000
 */

import { createClient, type Session } from "@supabase/supabase-js";
import { stringifySupabaseSession, serializeCookie } from "@supabase/auth-helpers-shared";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// ---------------------------------------------------------------------------
// Env loading (.env.local)
// ---------------------------------------------------------------------------

function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;
  const lines = readFileSync(filePath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(__dirname, "..", ".env.local"));
loadEnvFile(resolve(__dirname, "..", ".env"));

/** Anthropic org limit for claude-sonnet-4-6 (per error message). */
const ANTHROPIC_RPM_LIMIT = 50;
/** Each cache-miss lesson: summary + exercise generation. */
const LLM_CALLS_PER_LESSON = 2;
/** Lesson starts per minute — keeps ~2× calls under org RPM with headroom. */
const LESSONS_PER_MINUTE = Math.floor(ANTHROPIC_RPM_LIMIT / LLM_CALLS_PER_LESSON) - 5;
/** Max lessons generating at once (limits simultaneous Sonnet calls). */
const MAX_CONCURRENT_LESSONS = 8;
const MAX_RETRIES = 5;

function sleep(ms: number): Promise<void> {
  return new Promise((done) => setTimeout(done, ms));
}

// ---------------------------------------------------------------------------
// Rate limiter (rolling 60s window on lesson *starts*)
// ---------------------------------------------------------------------------

function createRateLimiter(maxPerMinute: number): () => Promise<void> {
  const windowMs = 60_000;
  const timestamps: number[] = [];

  return async function acquire(): Promise<void> {
    while (true) {
      const now = Date.now();
      while (timestamps.length > 0 && now - timestamps[0]! >= windowMs) {
        timestamps.shift();
      }
      if (timestamps.length < maxPerMinute) {
        timestamps.push(now);
        return;
      }
      const waitMs = windowMs - (now - timestamps[0]!) + 1;
      await sleep(waitMs);
    }
  };
}

// ---------------------------------------------------------------------------
// Concurrency limiter (max in-flight lesson requests)
// ---------------------------------------------------------------------------

function createSemaphore(maxConcurrent: number): {
  acquire: () => Promise<void>;
  release: () => void;
} {
  let inFlight = 0;
  const waiters: Array<() => void> = [];

  return {
    acquire: async () => {
      if (inFlight < maxConcurrent) {
        inFlight++;
        return;
      }
      await new Promise<void>((done) => waiters.push(done));
      inFlight++;
    },
    release: () => {
      inFlight--;
      const next = waiters.shift();
      if (next) next();
    },
  };
}

function isRateLimitError(status: number, body: string): boolean {
  return status === 429 || (status === 500 && body.includes("rate_limit"));
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): { chapters: string[]; baseUrl: string } {
  let chapters = ["14", "15", "16"];
  let baseUrl = process.env.CPPROAD_BASE_URL ?? "http://localhost:3001";

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--chapters" && argv[i + 1]) {
      chapters = argv[++i]!.split(",").map((c) => c.trim());
    } else if (arg === "--base-url" && argv[i + 1]) {
      baseUrl = argv[++i]!.replace(/\/$/, "");
    }
  }

  return { chapters, baseUrl };
}

// ---------------------------------------------------------------------------
// Auth cookie for Next.js middleware / route handlers
// ---------------------------------------------------------------------------

function supabaseProjectRef(supabaseUrl: string): string {
  return new URL(supabaseUrl).hostname.split(".")[0]!;
}

function buildSessionCookie(session: Session, supabaseUrl: string): string {
  const key = `sb-${supabaseProjectRef(supabaseUrl)}-auth-token`;
  const value = stringifySupabaseSession(session);
  return serializeCookie(key, value, { path: "/", sameSite: "lax" });
}

// ---------------------------------------------------------------------------
// API + DB helpers
// ---------------------------------------------------------------------------

interface LessonRow {
  slug: string;
  number: string;
  summary_md: string | null;
}

async function signIn(
  supabaseUrl: string,
  anonKey: string,
  email: string,
  password: string,
): Promise<Session> {
  const client = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    throw new Error(`Sign-in failed: ${error?.message ?? "no session"}`);
  }
  return data.session;
}

async function fetchUncachedLessons(
  serviceClient: ReturnType<typeof createClient>,
  chapterNumbers: string[],
): Promise<Map<string, LessonRow[]>> {
  const byChapter = new Map<string, LessonRow[]>();

  for (const chapterNumber of chapterNumbers) {
    const { data: chapter, error: chError } = await serviceClient
      .from("chapters")
      .select("id")
      .eq("number", chapterNumber)
      .single();

    if (chError || !chapter) {
      throw new Error(`Chapter ${chapterNumber} not found: ${chError?.message ?? "no data"}`);
    }

    const { data: lessons, error: lessonError } = await serviceClient
      .from("lessons")
      .select("slug, number, summary_md")
      .eq("chapter_id", chapter.id)
      .order("sort_order", { ascending: true });

    if (lessonError) {
      throw new Error(
        `Failed to load lessons for chapter ${chapterNumber}: ${lessonError.message}`,
      );
    }

    const uncached = (lessons ?? []).filter((l) => l.summary_md === null) as LessonRow[];
    byChapter.set(chapterNumber, uncached);
  }

  return byChapter;
}

interface LessonResult {
  slug: string;
  status: "ok" | "error";
  exerciseCount?: number;
  message?: string;
  durationMs: number;
}

interface QueuedLesson extends LessonRow {
  chapterNumber: string;
}

async function prefetchLesson(
  baseUrl: string,
  cookie: string,
  lesson: QueuedLesson,
  acquireSlot: () => Promise<void>,
  semaphore: ReturnType<typeof createSemaphore>,
): Promise<LessonResult> {
  const start = Date.now();
  const url = `${baseUrl}/api/lessons/${lesson.slug}`;
  const label = `[ch ${lesson.chapterNumber}] ${lesson.slug}`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await acquireSlot();
    await semaphore.acquire();

    try {
      const res = await fetch(url, {
        headers: { Cookie: cookie },
        signal: AbortSignal.timeout(10 * 60 * 1000),
      });

      const durationMs = Date.now() - start;
      const body = await res.text();

      if (!res.ok) {
        if (isRateLimitError(res.status, body) && attempt < MAX_RETRIES) {
          const waitSec = 30 * 2 ** attempt;
          console.log(`  ${label}: rate limited, retry in ${waitSec}s…`);
          await sleep(waitSec * 1000);
          continue;
        }
        return {
          slug: lesson.slug,
          status: "error",
          message: `HTTP ${res.status}: ${body.slice(0, 300)}`,
          durationMs,
        };
      }

      const data = JSON.parse(body) as {
        summaryMd?: string | null;
        exercises?: unknown[];
      };

      if (!data.summaryMd) {
        return {
          slug: lesson.slug,
          status: "error",
          message: "API returned no summaryMd after generation",
          durationMs,
        };
      }

      return {
        slug: lesson.slug,
        status: "ok",
        exerciseCount: data.exercises?.length ?? 0,
        durationMs,
      };
    } catch (err) {
      if (attempt < MAX_RETRIES) {
        const waitSec = 30 * 2 ** attempt;
        console.log(
          `  ${label}: ${err instanceof Error ? err.message : err}, retry in ${waitSec}s…`,
        );
        await sleep(waitSec * 1000);
        continue;
      }
      return {
        slug: lesson.slug,
        status: "error",
        message: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - start,
      };
    } finally {
      semaphore.release();
    }
  }

  return {
    slug: lesson.slug,
    status: "error",
    message: "Exhausted retries",
    durationMs: Date.now() - start,
  };
}

async function prefetchAll(
  queue: QueuedLesson[],
  baseUrl: string,
  cookie: string,
  acquireSlot: () => Promise<void>,
  semaphore: ReturnType<typeof createSemaphore>,
): Promise<LessonResult[]> {
  const results: LessonResult[] = new Array(queue.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (true) {
      const i = nextIndex++;
      if (i >= queue.length) return;

      const lesson = queue[i]!;
      const result = await prefetchLesson(baseUrl, cookie, lesson, acquireSlot, semaphore);
      results[i] = result;

      const extra =
        result.status === "ok"
          ? ` (${result.exerciseCount ?? 0} exercises, ${(result.durationMs / 1000).toFixed(1)}s)`
          : result.message
            ? ` — ${result.message}`
            : "";
      console.log(`  [ch ${lesson.chapterNumber}] ${result.slug}: ${result.status}${extra}`);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(MAX_CONCURRENT_LESSONS, queue.length) }, () => worker()),
  );

  return results;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const { chapters, baseUrl } = parseArgs(process.argv.slice(2));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.CPPROAD_EMAIL;
  const password = process.env.CPPROAD_PASSWORD;

  if (!supabaseUrl || !anonKey || !serviceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY.",
    );
    process.exit(1);
  }

  if (!email || !password) {
    console.error("Missing CPPROAD_EMAIL or CPPROAD_PASSWORD (owner sign-in credentials).");
    process.exit(1);
  }

  console.log(`Base URL: ${baseUrl}`);
  console.log(`Chapters: ${chapters.join(", ")}`);
  console.log(
    `Throttle: ≤${LESSONS_PER_MINUTE} lesson starts/min (~${LLM_CALLS_PER_LESSON} Sonnet calls each), max ${MAX_CONCURRENT_LESSONS} in flight`,
  );

  const serviceClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const lessonsByChapter = await fetchUncachedLessons(serviceClient, chapters);
  const totalUncached = [...lessonsByChapter.values()].reduce((n, ls) => n + ls.length, 0);
  console.log(`Uncached lessons to fetch: ${totalUncached}`);

  if (totalUncached === 0) {
    console.log("Done — nothing to prefetch.");
    return;
  }

  console.log("Signing in…");
  const session = await signIn(supabaseUrl, anonKey, email, password);
  const cookie = buildSessionCookie(session, supabaseUrl);
  const acquireSlot = createRateLimiter(LESSONS_PER_MINUTE);
  const semaphore = createSemaphore(MAX_CONCURRENT_LESSONS);

  const queue: QueuedLesson[] = chapters.flatMap((ch) =>
    (lessonsByChapter.get(ch) ?? []).map((lesson) => ({
      ...lesson,
      chapterNumber: ch,
    })),
  );

  console.log(`Queue: ${queue.map((l) => l.slug).join(", ")}`);

  const started = Date.now();
  const flat = await prefetchAll(queue, baseUrl, cookie, acquireSlot, semaphore);
  const ok = flat.filter((r) => r.status === "ok").length;
  const errors = flat.filter((r) => r.status === "error");
  console.log("");
  console.log(
    `Finished in ${((Date.now() - started) / 1000).toFixed(1)}s — ${ok} OK, ${errors.length} error(s).`,
  );

  if (errors.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
