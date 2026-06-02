import { notFound } from "next/navigation";
import { requireServerSession } from "@/lib/auth/require-auth";
import { createServiceClient } from "@/lib/supabase/server";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { NoteEditor } from "./NoteEditor";

interface Props {
  params: { slug: string };
}

export default async function DedicatedNotePage({ params }: Props) {
  const { supabase } = await requireServerSession();
  const serviceClient = createServiceClient();

  const { data: lesson } = await serviceClient
    .from("lessons")
    .select("id, slug, learncpp_title, my_title, number, chapters!inner(learncpp_title)")
    .eq("slug", params.slug)
    .single();

  if (!lesson) notFound();

  const chapter = lesson.chapters as unknown as { learncpp_title: string };
  const lessonTitle = (lesson.my_title ?? lesson.learncpp_title) as string;

  const { data: note } = await supabase
    .from("notes")
    .select("content, updated_at")
    .eq("lesson_id", lesson.id)
    .maybeSingle();

  void note; // fetched for SSR awareness; NoteEditor hydrates client-side via useNote

  return (
    <div className="mx-auto max-w-[800px] px-6 py-8">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/notes">Notes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-muted-foreground">{chapter.learncpp_title}</span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{lessonTitle}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">
            {lesson.number} — {lessonTitle}
          </h1>
        </div>
        <a
          href={`/lessons/${lesson.slug}`}
          className="text-xs font-medium text-accent hover:underline"
        >
          Open lesson →
        </a>
      </div>

      <NoteEditor lessonId={lesson.id} />
    </div>
  );
}
