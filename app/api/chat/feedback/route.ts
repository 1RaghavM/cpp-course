import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.user.id;

  const rawBody = await request.text();
  if (rawBody.length > 1024) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Request too large" } },
      { status: 400 },
    );
  }

  let body: { messageId?: string; value?: string };
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON" } },
      { status: 400 },
    );
  }
  const { messageId, value } = body;

  if (!messageId || !value || !["up", "down"].includes(value)) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "messageId and value (up|down) required" } },
      { status: 400 },
    );
  }

  // Verify the message exists AND belongs to a conversation owned by this user
  // before attempting the update. The implicit RLS would silently no-op a
  // wrong-owner update, hiding a 404 as a 200.
  const { data: ownership } = await supabase
    .from("messages")
    .select("id, conversations!inner(user_id)")
    .eq("id", messageId)
    .eq("conversations.user_id", userId)
    .maybeSingle();

  if (!ownership) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Message not found" } },
      { status: 404 },
    );
  }

  const { data: updated, error } = await supabase
    .from("messages")
    .update({ feedback: value })
    .eq("id", messageId)
    .select("id");

  if (error) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Update failed" } },
      { status: 400 },
    );
  }

  if (!updated || updated.length === 0) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Message not found" } },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
