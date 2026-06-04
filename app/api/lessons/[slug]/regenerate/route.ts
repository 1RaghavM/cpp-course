import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json(
    { error: "Lesson regeneration is currently disabled." },
    { status: 403 },
  );
}
