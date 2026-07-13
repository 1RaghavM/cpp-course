import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createRouteClient, createServiceClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/require-auth";
import { encryptApiKey } from "@/lib/crypto/api-keys";
import { exchangeCodeForToken, getGithubLogin, ensureRepo } from "@/lib/github/client";

export const dynamic = "force-dynamic";

const REPO_NAME = "cpproad-submissions";

export async function GET(request: NextRequest) {
  const supabase = createRouteClient();
  const authResult = await requireAuth(supabase);
  if (authResult instanceof NextResponse) return authResult;
  const userId = authResult.user.id;

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = request.cookies.get("gh_oauth_state")?.value;
  const profileUrl = new URL("/dashboard/profile", url.origin);

  const finish = (status: string) => {
    profileUrl.searchParams.set("github", status);
    const res = NextResponse.redirect(profileUrl);
    res.cookies.delete("gh_oauth_state");
    return res;
  };

  if (!code || !state || !cookieState || state !== cookieState) {
    return finish("error");
  }

  try {
    const token = await exchangeCodeForToken(code);
    const login = await getGithubLogin(token);
    const repoFullName = await ensureRepo(token, login, REPO_NAME);
    const enc = encryptApiKey(token);

    const svc = createServiceClient();
    const { error } = await svc.from("github_connections").upsert(
      {
        user_id: userId,
        github_login: login,
        repo_full_name: repoFullName,
        encrypted_token: enc.ciphertext,
        iv: enc.iv,
        auth_tag: enc.authTag,
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);

    return finish("connected");
  } catch (err) {
    console.error("[github-callback]", err instanceof Error ? err.message : err);
    return finish("error");
  }
}
