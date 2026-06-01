import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;

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

  const { error } = await supabase.from("messages").update({ feedback: value }).eq("id", messageId);

  if (error) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Message not found or update failed" } },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true });
}
