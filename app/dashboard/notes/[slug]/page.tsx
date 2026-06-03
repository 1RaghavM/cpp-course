import { notFound } from "next/navigation";
import Link from "next/link";
import { ExternalLinkIcon } from "lucide-react";
import { requireServerSession } from "@/lib/auth/require-auth";
import { createServiceClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { NoteEditor } from "@/app/(app)/notes/[slug]/NoteEditor";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function DashboardNotePage({ params }: Props) {
  const { slug } = await params;
  const { supabase } = await requireServerSession();
  const serviceClient = createServiceClient();

  const { data: lesson } = await serviceClient
    .from("lessons")
    .select("id, slug, learncpp_title, my_title, number, chapters!inner(learncpp_title)")
    .eq("slug", slug)
    .single();

  if (!lesson) notFound();

  const chapter = lesson.chapters as unknown as { learncpp_title: string };
  const lessonTitle = (lesson.my_title ?? lesson.learncpp_title) as string;

  const { data: note } = await supabase
    .from("notes")
    .select("content, updated_at")
    .eq("lesson_id", lesson.id)
    .maybeSingle();

  void note;

  return (
    <div className="mx-auto max-w-[800px] px-6 py-8">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard/notes">Notes</BreadcrumbLink>
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

      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-foreground truncate">
          {lesson.number} — {lessonTitle}
        </h1>
        <Button
          size="sm"
          variant="outline"
          render={<Link href={`/lessons/${lesson.slug}`} />}
        >
          <ExternalLinkIcon className="size-3.5" />
          Open lesson
        </Button>
      </div>

      <NoteEditor lessonId={lesson.id} />
    </div>
  );
}
