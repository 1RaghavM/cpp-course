import { requireServerSession } from "@/lib/auth/require-auth";
import PlaygroundClient from "./PlaygroundClient";

export default async function PlaygroundPage() {
  const { supabase } = await requireServerSession();

  const { data: savedState } = await supabase
    .from("playground_state")
    .select("source_code, stdin, language_std")
    .single();

  return (
    <PlaygroundClient
      savedState={
        savedState
          ? {
              sourceCode: savedState.source_code,
              stdin: savedState.stdin,
              languageStd: savedState.language_std as "c++17" | "c++20" | "c++23",
            }
          : null
      }
    />
  );
}
