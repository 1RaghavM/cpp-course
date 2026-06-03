import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_NOTE_BYTES = 50 * 1024;

export async function PATCH(
  request: NextRequest,
  { params }: { params: { lessonId: string } },
) {
  const supabase = createRouteClient();

  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.user.id;

  const { lessonId } = params;

  if (!UUID_REGEX.test(lessonId)) {
    return NextResponse.json({ error: "Invalid lessonId" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const content = (body as Record<string, unknown>)?.content;
  if (typeof content !== "string") {
    return NextResponse.json(
      { error: "content must be a string" },
      { status: 400 },
    );
  }

  if (Buffer.byteLength(content, "utf-8") > MAX_NOTE_BYTES) {
    return NextResponse.json(
      { error: "content exceeds 50 KB limit" },
      { status: 413 },
    );
  }

  const now = new Date().toISOString();

  const { error } = await supabase.from("notes").upsert(
    {
      user_id: userId,
      lesson_id: lessonId,
      content,
      updated_at: now,
    },
    { onConflict: "user_id,lesson_id" },
  );

  if (error) {
    console.error("notes upsert error:", error);
    return NextResponse.json({ error: "Failed to save note" }, { status: 500 });
  }

  return NextResponse.json({ updatedAt: now });
}
