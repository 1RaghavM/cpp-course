import { RoadmapTree } from "@/components/roadmap/RoadmapTree";

interface RoadmapLesson {
  id: string;
  number: string;
  slug: string;
  title: string;
  state: "not_started" | "in_progress" | "completed" | "skipped";
}

interface RoadmapChapter {
  id: number;
  number: string;
  title: string;
  completionPercent: number;
  lessons: RoadmapLesson[];
}

interface PathSectionProps {
  chapters: RoadmapChapter[];
}

export function PathSection({ chapters }: PathSectionProps) {
  return (
    <section className="home-fade-in home-fade-in-delay-3" id="path">
      <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-primary">The path</h2>
          <p className="text-sm text-secondary">
            All chapters and lessons in canonical order. Click any lesson to open it.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted">
          <LegendItem color="bg-muted ring-muted" label="Not started" />
          <LegendItem color="bg-accent ring-accent" label="In progress" />
          <LegendItem color="bg-success ring-success" label="Completed" />
          <LegendItem color="bg-warning ring-warning" label="Skipped" />
        </div>
      </div>

      <RoadmapTree chapters={chapters} />
    </section>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-block h-2 w-2 rounded-full ring-2 ring-offset-1 ring-offset-base ${color}`}
      />
      {label}
    </span>
  );
}
