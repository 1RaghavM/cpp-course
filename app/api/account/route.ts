import { NextResponse } from "next/server";
import { createRouteClient, createServiceClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

export async function DELETE() {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.session.user.id;

  const serviceClient = createServiceClient();

  const { data: convos } = await serviceClient
    .from("conversations")
    .select("id")
    .eq("user_id", userId);

  if (convos && convos.length > 0) {
    const convoIds = convos.map((c) => c.id);
    const { error } = await serviceClient
      .from("messages")
      .delete()
      .in("conversation_id", convoIds);

    if (error) {
      console.error("Failed to delete messages:", error);
      return NextResponse.json({ error: "Account deletion failed" }, { status: 500 });
    }
  }

  const tables = [
    "conversations",
    "submissions",
    "progress",
    "token_usage",
    "onboarding",
    "user_stats",
  ] as const;

  for (const table of tables) {
    const { error } = await serviceClient.from(table).delete().eq("user_id", userId);

    if (error) {
      console.error(`Failed to delete ${table}:`, error);
      return NextResponse.json({ error: "Account deletion failed" }, { status: 500 });
    }
  }

  const { error: authError } = await serviceClient.auth.admin.deleteUser(userId);

  if (authError) {
    console.error("Failed to delete auth user:", authError);
    return NextResponse.json({ error: "Account deletion failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
