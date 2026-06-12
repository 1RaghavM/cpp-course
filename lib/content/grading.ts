/**
 * Collapse any run of whitespace (spaces, tabs, newlines, CR) into a single
 * space and trim. Used for predict_output checks so that `3\n1` and `3 1` are
 * treated as the same answer — the separator a learner picks when typing
 * stdout shouldn't change correctness.
 *
 * Token-joining boundaries are preserved: `"3 1"` still differs from `"31"`.
 */
export function normalizePredictedOutput(s: string): string {
  return s.split(/\s+/).filter(Boolean).join(" ");
}
