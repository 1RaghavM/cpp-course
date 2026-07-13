import { createServiceClient } from "@/lib/supabase/server";
import { decryptApiKey } from "@/lib/crypto/api-keys";
import { putFile } from "@/lib/github/client";

/** kebab-case a title for use as a path segment. */
export function slugify(input: string): string {
  const s = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return s || "untitled";
}

/** `<lessonNumber>-<lessonSlug>/<exercise-slug>/submission-<n>.cpp` */
export function buildSubmissionPath(
  lessonNumber: string,
  lessonSlug: string,
  exerciseTitle: string,
  n: number,
): string {
  return `${lessonNumber}-${lessonSlug}/${slugify(exerciseTitle)}/submission-${n}.cpp`;
}

interface SyncArgs {
  userId: string;
  exerciseId: string;
  sourceCode: string;
}

/**
 * Best-effort mirror of a passed submission to the user's GitHub repo.
 * Assumes the submission row is ALREADY stored. Never throws — a GitHub
 * failure is logged and swallowed so it cannot break the submit response.
 */
export async function syncSubmission({ userId, exerciseId, sourceCode }: SyncArgs): Promise<void> {
  try {
    const svc = createServiceClient();

    const { data: conn } = await svc
      .from("github_connections")
      .select("github_login, repo_full_name, encrypted_token, iv, auth_tag")
      .eq("user_id", userId)
      .single();
    if (!conn) return; // user hasn't connected GitHub

    const { data: ex } = await svc
      .from("exercises")
      .select("title, lessons(number, slug)")
      .eq("id", exerciseId)
      .single();
    if (!ex) return;

    type ExRow = { title: string; lessons: { number: string; slug: string } | null };
    const exRow = (ex as unknown) as ExRow;
    const lesson = exRow.lessons;
    if (!lesson) return;

    // This passed submit is already stored, so count includes it → index = count - 1.
    const { count } = await svc
      .from("submissions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("exercise_id", exerciseId)
      .eq("mode", "submit")
      .eq("status", "passed");
    const n = Math.max(0, (count ?? 1) - 1);

    const path = buildSubmissionPath(lesson.number, lesson.slug, exRow.title, n);
    const token = decryptApiKey({
      ciphertext: conn.encrypted_token,
      iv: conn.iv,
      authTag: conn.auth_tag,
    });

    await putFile(token, conn.repo_full_name, path, sourceCode, `Solve ${exRow.title}`);
  } catch (err) {
    // ponytail: awaited inline in the submit route; if latency bites, move to Next after()/queue.
    console.error("[github-sync] failed:", err instanceof Error ? err.message : err);
  }
}
