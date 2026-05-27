interface HeroSectionProps {
  stats: {
    totalLessons: number;
    completed: number;
    inProgress: number;
    chaptersTotal: number;
    chaptersStarted: number;
    overallPercent: number;
  };
}

export function HeroSection({ stats }: HeroSectionProps) {
  return (
    <section className="reveal reveal-d2">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl italic text-primary">Progress</h2>
          <p className="mt-1.5 text-sm text-secondary">
            <span className="font-mono tabular-nums text-primary">{stats.completed}</span> of{" "}
            <span className="font-mono tabular-nums">{stats.totalLessons}</span> lessons
            <span className="mx-2 opacity-30">·</span>
            <span className="font-mono tabular-nums text-primary">
              {stats.chaptersStarted}
            </span>{" "}
            of <span className="font-mono tabular-nums">{stats.chaptersTotal}</span> chapters
            {stats.inProgress > 0 && (
              <>
                <span className="mx-2 opacity-30">·</span>
                <span className="font-mono tabular-nums text-steel">{stats.inProgress}</span> in
                flight
              </>
            )}
          </p>
        </div>
        <span className="font-display text-4xl tabular-nums text-accent sm:text-5xl">
          {stats.overallPercent}
          <span className="text-2xl text-muted sm:text-3xl">%</span>
        </span>
      </div>
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-elevated">
        <div
          className="h-full rounded-full bg-accent/80 transition-all duration-700"
          style={{ width: `${stats.overallPercent}%` }}
        />
      </div>
    </section>
  );
}
