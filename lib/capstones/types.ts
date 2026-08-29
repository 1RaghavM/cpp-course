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

/**
 * Capstone shape as served. `reference_solution` is deliberately absent: no
 * runtime path reads it (grading uses milestone tests, not the solution), and
 * the column is REVOKEd from the `authenticated`/`anon` roles at the database
 * layer, so selecting it here would fail. Only the offline seed script writes it.
 */
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

/**
 * Kept as an alias so callers don't churn. There is no longer an internal/public
 * split — the one field that differed is no longer selected by either path.
 */
export type InternalCapstone = PublicCapstone;

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
