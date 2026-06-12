/**
 * Capstones unlock at this fraction of stage lessons completed-or-skipped.
 * Matches the spec at docs/superpowers/specs/2026-06-11-capstone-projects-design.md §1.
 */
export const UNLOCK_THRESHOLD = 0.8;

/**
 * Pure: given a user's completed+skipped count and the total lessons in a
 * stage, return whether the capstone for that stage is unlocked.
 *
 * A stage with zero lessons is never unlocked (defensive — should not happen).
 */
export function isCapstoneUnlocked(completed: number, total: number): boolean {
  if (total <= 0) return false;
  return completed / total >= UNLOCK_THRESHOLD;
}
