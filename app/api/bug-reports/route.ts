import { NextResponse } from "next/server";
import { z } from "zod";
import { createRouteClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";

const bugReportSchema = z.object({
  lesson_id: z.string().uuid().optional(),
  category: z.enum(["ui", "code_execution", "lesson_content", "tutor", "other"]),
  description: z.string().min(10).max(2000),
});

export async function POST(request: Request) {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.user.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bugReportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { lesson_id, category, description } = parsed.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- table not yet in generated types; regenerate after migration
  const { error } = await (supabase as any).from("bug_reports").insert({
    user_id: userId,
    lesson_id: lesson_id ?? null,
    category,
    description,
  });

  if (error) {
    console.error("Failed to insert bug report:", error);
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
