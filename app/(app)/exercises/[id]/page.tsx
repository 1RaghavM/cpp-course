import { notFound, redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface Props {
  params: { id: string };
}

export default async function ExercisePage({ params }: Props) {
  const supabase = createServiceClient();
  const { id } = params;

  // Fetch exercise with its lesson info
  const { data: exercise, error } = await supabase
    .from("exercises")
    .select("id, lesson_id, sort_order")
    .eq("id", id)
    .single();

  if (error || !exercise) notFound();

  // Fetch lesson slug
  const { data: lesson } = await supabase
    .from("lessons")
    .select("slug")
    .eq("id", exercise.lesson_id)
    .single();

  if (!lesson) notFound();

  // Redirect to the unified lesson page with exercise index
  // sort_order is 0-indexed, so we can use it directly
  redirect(`/lessons/${lesson.slug}?ex=${exercise.sort_order}`);
}
