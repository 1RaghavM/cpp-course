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

function StatCard({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: number | string;
  suffix?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface/60 p-4 backdrop-blur-sm">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      <p
        className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${accent ? "text-accent" : "text-primary"}`}
      >
        {value}
        {suffix && <span className="text-base font-normal text-muted">{suffix}</span>}
      </p>
    </div>
  );
}

function ProgressRing({ percent }: { percent: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="hsl(var(--bg-elevated))"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          stroke="hsl(var(--accent))"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
          style={{ filter: "drop-shadow(0 0 8px hsl(var(--accent) / 0.4))" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-bold tabular-nums text-primary">{percent}</span>
        <span className="text-xs text-muted">percent</span>
      </div>
    </div>
  );
}

export function HeroSection({ stats }: HeroSectionProps) {
  return (
    <section className="home-fade-in relative overflow-hidden rounded-2xl border border-border bg-surface/40 p-6 sm:p-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, hsl(var(--accent)) 0%, transparent 50%), radial-gradient(circle at 80% 20%, hsl(168 76% 30%) 0%, transparent 40%)",
        }}
      />

      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">C++ curriculum</p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Your path through modern C++
          </h1>
          <p className="mt-3 text-secondary leading-relaxed">
            345 lessons across 34 chapters, from variables to templates. Summaries and exercises
            are generated once and cached — revisit anytime from the database.
          </p>
        </div>

        <div className="flex items-center gap-6">
          <ProgressRing percent={stats.overallPercent} />
        </div>
      </div>

      <div className="relative mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Lessons done"
          value={stats.completed}
          suffix={` / ${stats.totalLessons}`}
          accent
        />
        <StatCard label="In progress" value={stats.inProgress} />
        <StatCard
          label="Chapters"
          value={stats.chaptersStarted}
          suffix={` / ${stats.chaptersTotal}`}
        />
        <StatCard label="Remaining" value={stats.totalLessons - stats.completed - stats.inProgress} />
      </div>
    </section>
  );
}
