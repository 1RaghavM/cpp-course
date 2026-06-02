export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-[720px] px-6 py-8">
      <div className="space-y-8 animate-pulse">
        <div className="rounded-lg border border-border bg-surface p-6">
          <div className="h-3 w-32 rounded bg-elevated" />
          <div className="mt-3 h-4 w-48 rounded bg-elevated" />
          <div className="mt-2 h-6 w-64 rounded bg-elevated" />
          <div className="mt-4 h-20 rounded-md bg-elevated" />
          <div className="mt-4 h-10 w-40 rounded-md bg-elevated" />
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="h-4 w-20 rounded bg-elevated" />
            <div className="h-3 w-8 rounded bg-elevated" />
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="rounded-lg border border-border p-4">
                <div className="h-4 w-24 rounded bg-elevated" />
                <div className="mt-3 h-1 rounded-full bg-elevated" />
                <div className="mt-2 h-3 w-16 rounded bg-elevated" />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 max-[480px]:grid-cols-1">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="rounded-lg bg-elevated p-4">
              <div className="h-3 w-16 rounded bg-hover" />
              <div className="mt-2 h-5 w-10 rounded bg-hover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
