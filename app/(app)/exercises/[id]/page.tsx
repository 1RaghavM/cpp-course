import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import type { Exercise } from "@/lib/supabase/types";
import ExerciseClient from "./ExerciseClient";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function ExercisePage({ params }: Props) {
  // Use service client to bypass RLS (auth enforced by middleware)
  const supabase = createServiceClient();
  const { id } = params;

  // ---- Load exercise --------------------------------------------------------
  const { data, error: exErr } = await supabase
    .from("exercises")
    .select("id, title, prompt_md, starter_code, difficulty")
    .eq("id", id)
    .single();

  if (exErr || !data) notFound();
  const exercise = data as Exercise;

  // ---- Load sample test cases -----------------------------------------------
  const { data: rawTestCases } = await supabase
    .from("test_cases")
    .select("label, stdin, expected_stdout, sort_order")
    .eq("exercise_id", id)
    .eq("is_sample", true)
    .order("sort_order", { ascending: true });
  const sampleTestCases = rawTestCases as Array<{ label: string; stdin: string; expected_stdout: string; sort_order: number }> | null;

  // ---- Load last passing submission -----------------------------------------
  const { data: rawSub } = await supabase
    .from("submissions")
    .select("source_code, created_at")
    .eq("exercise_id", id)
    .eq("mode", "submit")
    .eq("status", "passed")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const lastPassingSub = rawSub as { source_code: string; created_at: string } | null;

  return (
    <ExerciseClient
      exercise={{
        id: exercise.id,
        title: exercise.title,
        promptMd: exercise.prompt_md,
        starterCode: exercise.starter_code,
        difficulty: exercise.difficulty,
      }}
      sampleTestCases={
        sampleTestCases?.map((tc) => ({
          label: tc.label,
          stdin: tc.stdin,
          expectedStdout: tc.expected_stdout,
        })) ?? []
      }
      lastPassingCode={lastPassingSub?.source_code ?? null}
    />
  );
}
