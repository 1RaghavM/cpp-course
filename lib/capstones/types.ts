import type { Stage } from "@/lib/dashboard/types";

export type CapstoneSlug = "basics" | "memory-oop" | "stl-templates" | "advanced";

export const CAPSTONE_SLUGS: readonly CapstoneSlug[] = [
  "basics",
  "memory-oop",
  "stl-templates",
  "advanced",
] as const;

export interface MilestoneTest {
  name: string;
  stdin: string;
  expected_stdout: string;
  timeout_ms: number;
}

export interface CapstoneMilestone {
  id: string;
  ordinal: number;
  title: string;
  spec_anchor: string;
  tests: MilestoneTest[];
}

/** Public capstone shape — reference_solution stripped before returning to clients. */
export interface PublicCapstone {
  id: string;
  slug: CapstoneSlug;
  stage: Stage;
  title: string;
  description_md: string;
  language_standard: string;
  compile_flags: string[];
  starter_code: string;
  milestones: CapstoneMilestone[];
}

/** Internal capstone shape — includes the reference solution. Server-side only. */
export interface InternalCapstone extends PublicCapstone {
  reference_solution: string;
}

export interface CapstoneAttempt {
  milestone_id: string;
  passed: boolean;
  last_attempted_at: string;
}


/** Author-side schema for content/capstones/<slug>.tests.json. */
export interface CapstoneTestsFile {
  slug: CapstoneSlug;
  stage: Stage;
  title: string;
  language_standard: string;
  compile_flags: string[];
  starter_code: string;
  reference_solution: string;
  milestones: Array<{
    id: number;
    title: string;
    spec_anchor: string;
    tests: MilestoneTest[];
  }>;
}
