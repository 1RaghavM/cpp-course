import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import type { CppStandard } from "@/lib/judge0/client";

export const dynamic = "force-dynamic";

const VALID_STANDARDS: CppStandard[] = ["c++17", "c++20", "c++23"];
const MAX_SOURCE_SIZE = 50 * 1024;

export async function GET() {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.user.id;

  const { data, error } = await supabase
    .from("playground_state")
    .select("source_code, stdin, language_std")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "No saved state" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.user.id;

  let body: { source_code: string; stdin?: string; language_std?: string };
  try {
    body = await request.json();
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

  if (!VALID_STANDARDS.includes(language_std as CppStandard)) {
    return NextResponse.json({ error: "Invalid language_std" }, { status: 400 });
  }

  const { error } = await supabase
    .from("playground_state")
    .upsert(
      {
        user_id: userId,
        source_code,
        stdin,
        language_std,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (error) {
    return NextResponse.json({ error: "Failed to save state" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
