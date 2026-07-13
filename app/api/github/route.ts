import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

export async function DELETE() {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.user.id;

  // RLS "own connection delete" policy restricts this to the caller's row.
  await supabase.from("github_connections").delete().eq("user_id", userId);

  return NextResponse.json({ ok: true });
}
