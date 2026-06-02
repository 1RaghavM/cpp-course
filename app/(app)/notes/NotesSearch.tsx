"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { NoteCard } from "@/components/notes/NoteCard";

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

interface NotesSearchProps {
  notes: NoteRow[];
  chapters: ChapterGroup[];
}

export function NotesSearch({ notes, chapters }: NotesSearchProps) {
  const [query, setQuery] = useState("");

  const lowerQuery = query.toLowerCase().trim();

  const filteredChapters = lowerQuery
    ? chapters
        .map((ch) => ({
          ...ch,
          notes: ch.notes.filter(
            (n) =>
              n.lessonTitle.toLowerCase().includes(lowerQuery) ||
              n.content.toLowerCase().includes(lowerQuery),
          ),
        }))
        .filter((ch) => ch.notes.length > 0)
    : chapters;

  return (
    <>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes…"
          className="pl-9"
        />
      </div>

      {filteredChapters.length === 0 ? (
        <p className="text-sm text-muted py-4">No notes match your search.</p>
      ) : (
        <Accordion
          multiple
          defaultValue={filteredChapters.map((ch) => ch.title)}
        >
          {filteredChapters.map((chapter) => (
            <AccordionItem key={chapter.title} value={chapter.title}>
              <AccordionTrigger className="text-sm font-semibold text-primary">
                {chapter.title}
                <span className="ml-2 text-xs font-normal text-muted">
                  ({chapter.notes.length})
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 py-1">
                  {chapter.notes.map((note) => (
                    <NoteCard
                      key={note.lessonId}
                      lessonSlug={note.lessonSlug}
                      lessonNumber={note.lessonNumber}
                      lessonTitle={note.lessonTitle}
                      contentPreview={note.content}
                      updatedAt={note.updatedAt}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </>
  );
}
