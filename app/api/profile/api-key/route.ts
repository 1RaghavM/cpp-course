import { NextResponse } from "next/server";
import { createRouteClient, createServiceClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { encryptApiKey, keyPreview } from "@/lib/crypto/api-keys";

export const dynamic = "force-dynamic";

const GEMINI_KEY_REGEX = /^AIza[A-Za-z0-9_-]{35}$/;
const MAX_SAVE_ATTEMPTS_PER_HOUR = 5;

async function checkSaveRateLimit(userId: string): Promise<boolean> {
  const serviceClient = createServiceClient();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await serviceClient
    .from("user_api_key_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("event", ["created", "updated"])
    .gte("created_at", oneHourAgo);

  return (count ?? 0) < MAX_SAVE_ATTEMPTS_PER_HOUR;
}

async function validateGeminiKey(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${encodeURIComponent(apiKey)}`,
      { signal: AbortSignal.timeout(5000) },
    );
    return res.ok;
  } catch {
    return false;
  }
}

// ─── GET: key status ─────────────────────────────────────────────────────────

export async function GET() {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.user.id;

  const { data } = await supabase
    .from("user_api_keys")
    .select("key_preview, is_valid, provider")
    .eq("user_id", userId)
    .eq("provider", "google")
    .single();

  if (!data) {
    return NextResponse.json({ hasKey: false });
  }

  return NextResponse.json({
    hasKey: true,
    preview: data.key_preview,
    isValid: data.is_valid,
    provider: data.provider,
  });
}

// ─── POST: save or update key ────────────────────────────────────────────────

export async function POST(request: Request) {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.user.id;

  const withinLimit = await checkSaveRateLimit(userId);
  if (!withinLimit) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many attempts. Try again in an hour." } },
      { status: 429 },
    );
  }

  let body: { provider?: string; apiKey?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON" } },
      { status: 400 },
    );
  }

  const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  if (!GEMINI_KEY_REGEX.test(apiKey)) {
    return NextResponse.json(
      { error: { code: "INVALID_FORMAT", message: "Invalid key format" } },
      { status: 400 },
    );
  }

  const isLive = await validateGeminiKey(apiKey);
  if (!isLive) {
    return NextResponse.json(
      {
        error: {
          code: "KEY_VALIDATION_FAILED",
          message:
            "This key doesn't appear to work. Double-check that you copied the full key from Google AI Studio.",
        },
      },
      { status: 422 },
    );
  }

  const encrypted = encryptApiKey(apiKey);
  const preview = keyPreview(apiKey);

  const { data: existing } = await supabase
    .from("user_api_keys")
    .select("id")
    .eq("user_id", userId)
    .eq("provider", "google")
    .single();

  if (existing) {
    await supabase
      .from("user_api_keys")
      .update({
        encrypted_key: encrypted.ciphertext,
        iv: encrypted.iv,
        auth_tag: encrypted.authTag,
        key_preview: preview,
        is_valid: true,
        key_version: 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    const serviceClient = createServiceClient();
    await serviceClient
      .from("user_api_key_events")
      .insert({ user_id: userId, event: "updated" });
  } else {
    await supabase.from("user_api_keys").insert({
      user_id: userId,
      provider: "google",
      encrypted_key: encrypted.ciphertext,
      iv: encrypted.iv,
      auth_tag: encrypted.authTag,
      key_preview: preview,
      is_valid: true,
      key_version: 1,
    });

    const serviceClient = createServiceClient();
    await serviceClient
      .from("user_api_key_events")
      .insert({ user_id: userId, event: "created" });
  }

  return NextResponse.json({ preview, isValid: true });
}

// ─── DELETE: remove key ──────────────────────────────────────────────────────

export async function DELETE(request: Request) {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.user.id;

  let body: { confirm?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON" } },
      { status: 400 },
    );
  }

  if (body.confirm !== true) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Confirmation required" } },
      { status: 400 },
    );
  }

  await supabase
    .from("user_api_keys")
    .delete()
    .eq("user_id", userId)
    .eq("provider", "google");

  const serviceClient = createServiceClient();
  await serviceClient
    .from("user_api_key_events")
    .insert({ user_id: userId, event: "deleted" });

  return NextResponse.json({ ok: true });
}
