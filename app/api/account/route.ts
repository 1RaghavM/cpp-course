import { NextResponse } from "next/server";
import { createRouteClient, createServiceClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.user.id;

  // Irreversible and cascades through every user-scoped table, so require an
  // explicit confirm — same contract as DELETE /api/profile/api-key.
  let body: { confirm?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Confirmation required" }, { status: 400 });
  }

  if (body.confirm !== true) {
    return NextResponse.json({ error: "Confirmation required" }, { status: 400 });
  }

  const serviceClient = createServiceClient();
  const { error: authError } = await serviceClient.auth.admin.deleteUser(userId);

  if (authError) {
    console.error("Failed to delete auth user:", authError);
    return NextResponse.json({ error: "Account deletion failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
