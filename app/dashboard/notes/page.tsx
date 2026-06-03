import { requireServerSession } from "@/lib/auth/require-auth";
import { NotesSearch } from "@/app/(app)/notes/NotesSearch";

export const dynamic = "force-dynamic";

interface NoteRow {
  lessonId: string;
  lessonSlug: string;
  lessonTitle: string;
  lessonNumber: string;
  chapterTitle: string;
  chapterSortOrder: number;
  lessonSortOrder: number;
  content: string;
  updatedAt: string;
}

interface ChapterGroup {
  title: string;
  sortOrder: number;
  notes: NoteRow[];
}

export default async function NotesOverviewPage() {
  const { supabase } = await requireServerSession();

  const { data, error } = await supabase
    .from("notes")
    .select(
      "lesson_id, content, updated_at, lessons!inner(slug, learncpp_title, my_title, number, sort_order, chapter_id, chapters!inner(learncpp_title, sort_order))",
    )
    .order("updated_at", { ascending: false });

  if (error) {
    return (
      <div className="mx-auto max-w-[800px] px-6 py-8">
        <p className="text-sm text-error">Failed to load notes.</p>
      </div>
    );
  }

  const notes: NoteRow[] = (data ?? []).map((row: Record<string, unknown>) => {
    const lesson = row.lessons as Record<string, unknown>;
    const chapter = lesson.chapters as Record<string, unknown>;
    return {
      lessonId: row.lesson_id as string,
      lessonSlug: lesson.slug as string,
      lessonTitle: ((lesson.my_title as string) ?? (lesson.learncpp_title as string)),
      lessonNumber: lesson.number as string,
      chapterTitle: chapter.learncpp_title as string,
      chapterSortOrder: chapter.sort_order as number,
      lessonSortOrder: lesson.sort_order as number,
      content: row.content as string,
      updatedAt: row.updated_at as string,
    };
  });

  if (notes.length === 0) {
    return (
      <div className="mx-auto max-w-[800px] px-6 py-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-300 motion-safe:delay-200">
        <h1 className="text-2xl font-bold text-foreground mb-2">Notes</h1>
        <p className="text-sm text-muted-foreground">
          No notes yet. Open the notepad on any lesson to start.
        </p>
      </div>
    );
  }

  const chapterMap = new Map<string, ChapterGroup>();
  for (const note of notes) {
    const existing = chapterMap.get(note.chapterTitle);
    if (existing) {
      existing.notes.push(note);
    } else {
      chapterMap.set(note.chapterTitle, {
        title: note.chapterTitle,
        sortOrder: note.chapterSortOrder,
        notes: [note],
      });
    }
  }

  const chapters = Array.from(chapterMap.values()).sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );

  for (const ch of chapters) {
    ch.notes.sort((a, b) => a.lessonSortOrder - b.lessonSortOrder);
  }

  return (
    <div className="mx-auto max-w-[800px] px-6 py-8">
      <div className="mb-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-300">
        <h1 className="text-2xl font-bold text-foreground">Notes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {notes.length} note{notes.length !== 1 ? "s" : ""} across{" "}
          {chapters.length} chapter{chapters.length !== 1 ? "s" : ""}
        </p>
      </div>

      <NotesSearch chapters={chapters} />
    </div>
  );
}
