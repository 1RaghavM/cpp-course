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
    <section className="reveal reveal-d4" id="path">
      <div className="mb-4">
        <h2 className="font-display text-xl italic text-primary">The path</h2>
        <p className="mt-1 text-sm text-secondary">
          {chapters.length} chapters · all lessons in order
        </p>
      </div>
      <RoadmapTree chapters={chapters} />
    </section>
  );
}
