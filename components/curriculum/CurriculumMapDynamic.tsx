"use client";

import dynamic from "next/dynamic";
import type { CurriculumMapProps } from "./CurriculumMap";

const CurriculumMap = dynamic(
  () => import("./CurriculumMap").then((mod) => mod.CurriculumMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
        Loading curriculum map…
      </div>
    ),
  }
);

export function CurriculumMapDynamic(props: CurriculumMapProps) {
  return <CurriculumMap {...props} />;
}
