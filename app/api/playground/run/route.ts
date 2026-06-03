import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { submitCode, type CppStandard } from "@/lib/judge0/client";
import { checkPlaygroundRateLimit } from "@/lib/rate/playground-limiter";

export const dynamic = "force-dynamic";

const MAX_SOURCE_SIZE = 50 * 1024;
const VALID_STANDARDS: CppStandard[] = ["c++17", "c++20", "c++23"];

interface RequestBody {
  source_code: string;
  stdin?: string;
  language_std?: CppStandard;
}

export async function POST(request: NextRequest) {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.user.id;

  const rateCheck = await checkPlaygroundRateLimit(supabase, userId);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded. ${rateCheck.reason ?? ""}`.trim() },
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
