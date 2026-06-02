"use client";

import { useEffect, useState } from "react";
import { Progress, ProgressLabel } from "@/components/ui/progress";

export default function LessonLoading() {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setValue((prev) => {
        if (prev >= 90) return 90;
        return prev + Math.random() * 12;
      });
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full bg-base">
      <div className="w-64 space-y-3">
        <Progress value={value}>
          <ProgressLabel className="text-sm text-muted">
            Generating lesson content…
          </ProgressLabel>
        </Progress>
      </div>
    </div>
  );
}
