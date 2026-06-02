import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { lessonId: string } },
) {
  const supabase = createRouteClient();

  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.session.user.id;

  const { lessonId } = params;

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
