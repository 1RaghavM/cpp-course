"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
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
  chapters: ChapterGroup[];
}

export function NotesSearch({ chapters }: NotesSearchProps) {
  const [query, setQuery] = useState("");
  const reducedMotion = useReducedMotion();

  const listVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = reducedMotion
    ? { hidden: {}, visible: {} }
    : {
        hidden: { opacity: 0, y: 8 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.32,
            ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
          },
        },
      };

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
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search notes…"
          className="pl-9"
        />
      </div>

      {filteredChapters.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
          No notes match your search.
        </p>
      ) : (
        <Accordion
          multiple
          defaultValue={filteredChapters.map((ch) => ch.title)}
        >
          {filteredChapters.map((chapter) => (
            <AccordionItem key={chapter.title} value={chapter.title}>
              <AccordionTrigger className="text-sm font-semibold text-foreground">
                {chapter.title}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  ({chapter.notes.length})
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <motion.div
                  className="space-y-2 py-1"
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {chapter.notes.map((note) => (
                    <motion.div key={note.lessonId} variants={itemVariants}>
                      <NoteCard
                        lessonSlug={note.lessonSlug}
                        lessonNumber={note.lessonNumber}
                        lessonTitle={note.lessonTitle}
                        contentPreview={note.content}
                        updatedAt={note.updatedAt}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </>
  );
}
