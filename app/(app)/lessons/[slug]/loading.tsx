export default function LessonLoading() {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-base">
      <div className="w-64 space-y-3">
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-3/4 rounded-full bg-primary animate-pulse" />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Generating lesson content…
        </p>
      </div>
    </div>
  );
}
