import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { submitCode, type CppStandard } from "@/lib/judge0/client";

export const dynamic = "force-dynamic";

const MAX_SOURCE_SIZE = 50 * 1024;
const VALID_STANDARDS: CppStandard[] = ["c++17", "c++20", "c++23"];
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;

const recentRuns = new Map<string, number[]>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const timestamps = recentRuns.get(userId) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    recentRuns.set(userId, recent);
    return true;
  }
  recent.push(now);
  recentRuns.set(userId, recent);
  return false;
}

interface RequestBody {
  source_code: string;
  stdin?: string;
  language_std?: CppStandard;
}

export async function POST(request: NextRequest) {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.session.user.id;

  if (isRateLimited(userId)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Max 10 runs per minute." },
      { status: 429 },
    );
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { source_code, stdin = "", language_std = "c++20" } = body;

  if (!source_code || typeof source_code !== "string") {
    return NextResponse.json({ error: "source_code is required" }, { status: 400 });
  }

  if (Buffer.byteLength(source_code, "utf-8") > MAX_SOURCE_SIZE) {
    return NextResponse.json({ error: "Source code exceeds 50 KB limit" }, { status: 400 });
  }

  if (!VALID_STANDARDS.includes(language_std)) {
    return NextResponse.json(
      { error: `language_std must be one of: ${VALID_STANDARDS.join(", ")}` },
      { status: 400 },
    );
  }

  const result = await submitCode({
    sourceCode: source_code,
    stdin,
    languageStd: language_std,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  const { data } = result;
  return NextResponse.json({
    status: data.status,
    stdout: data.stdout,
    stderr: data.stderr,
    compileOutput: data.compileOutput,
    exitCode: data.exitCode,
    wallTimeMs: data.wallTimeMs,
  });
}
