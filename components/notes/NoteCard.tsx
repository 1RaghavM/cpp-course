import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface NoteCardProps {
  lessonSlug: string;
  lessonNumber: string;
  lessonTitle: string;
  contentPreview: string;
  updatedAt: string;
}

function stripMarkdown(md: string): string {
  return md
    .replace(/[#*`~>\-\[\]()!]/g, "")
    .replace(/\n+/g, " ")
    .trim();
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NoteCard({
  lessonSlug,
  lessonNumber,
  lessonTitle,
  contentPreview,
  updatedAt,
}: NoteCardProps) {
  const snippet = stripMarkdown(contentPreview).slice(0, 80);

  return (
    <Link
      href={`/notes/${lessonSlug}`}
      className="flex items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3 transition-all duration-200 hover:bg-hover motion-safe:hover:-translate-y-0.5 hover:shadow-md group"
    >
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded bg-accent/10 text-[10px] font-bold text-accent">
        {lessonNumber}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground group-hover:text-accent transition-colors truncate">
          {lessonTitle}
        </p>
        {snippet && (
          <p className="mt-0.5 text-xs text-muted-foreground truncate">{snippet}…</p>
        )}
      </div>
      <Badge variant="secondary" className="shrink-0 text-[10px]">
        {relativeTime(updatedAt)}
      </Badge>
    </Link>
  );
}
