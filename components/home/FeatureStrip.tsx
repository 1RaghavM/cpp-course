const features = [
  {
    title: "Cached summaries",
    description: "LLM-generated lesson notes stored on first visit. Revisits never call the API.",
    icon: CacheIcon,
  },
  {
    title: "Sandboxed execution",
    description: "Run and submit C++ in an isolated Judge0 + gVisor environment.",
    icon: TerminalIcon,
  },
  {
    title: "AI tutor",
    description: "Streaming hints with a 4-tier policy — nudge first, reveal last.",
    icon: TutorIcon,
  },
  {
    title: "345-lesson path",
    description: "Full learncpp.com curriculum in canonical order with per-chapter progress.",
    icon: PathIcon,
  },
] as const;

export function FeatureStrip() {
  return (
    <section className="home-fade-in home-fade-in-delay-2">
      <h2 className="mb-4 font-display text-lg font-semibold text-primary">How it works</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="group rounded-xl border border-border bg-surface/50 p-4 transition-colors hover:border-accent/30 hover:bg-surface"
          >
            <div className="mb-3 inline-flex rounded-lg bg-elevated p-2 text-accent transition-colors group-hover:bg-accent/10">
              <feature.icon />
            </div>
            <h3 className="font-medium text-primary">{feature.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-secondary">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CacheIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375"
      />
    </svg>
  );
}

function TerminalIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 7.5l3 2.25-3 2.25m4.5 0h3m-9 8.25h13.5A2.25 2.25 0 0021 18V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v12a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  );
}

function TutorIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
      />
    </svg>
  );
}

function PathIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934a1.125 1.125 0 01-1.059 0l-3.869-1.934A1.125 1.125 0 0012 2.25c-.622 0-1.128.462-1.628 1.006L6.503 5.69A1.125 1.125 0 005.25 6.75v8.25c0 .426.241.816.622 1.006l4.875 2.437a1.125 1.125 0 001.059 0z"
      />
    </svg>
  );
}
