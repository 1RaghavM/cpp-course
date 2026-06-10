import type { ConceptCheck } from "@/lib/supabase/types";

const TARGET_SIZE = 12;
const MIN_SIZE = 10;
const MAX_SIZE = 15;
const CURRENT_RATIO = 0.6;

export interface AttemptSummary {
  checkId: string;
  lastCorrect: boolean | null;
  lastAnsweredAt: string | null;
}

export interface ChapterQuizInput {
  currentChapterChecks: ConceptCheck[];
  priorChapterChecks: ConceptCheck[];
  attemptHistory: AttemptSummary[];
  seed: string;
}

function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function makeRng(seed: string): () => number {
  let state = hash32(seed);
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function rankByHistory(checks: ConceptCheck[], history: AttemptSummary[]): ConceptCheck[] {
  const byId = new Map(history.map((h) => [h.checkId, h]));
  const wrong: ConceptCheck[] = [];
  const unseen: ConceptCheck[] = [];
  const correct: ConceptCheck[] = [];

  for (const c of checks) {
    const h = byId.get(c.id);
    if (!h || h.lastCorrect === null) unseen.push(c);
    else if (h.lastCorrect === false) wrong.push(c);
    else correct.push(c);
  }

  const sortByAnsweredAt = (a: ConceptCheck, b: ConceptCheck) => {
    const ah = byId.get(a.id)?.lastAnsweredAt ?? "";
    const bh = byId.get(b.id)?.lastAnsweredAt ?? "";
    return ah.localeCompare(bh);
  };
  wrong.sort(sortByAnsweredAt);
  correct.sort(sortByAnsweredAt);

  return [...wrong, ...unseen, ...correct];
}

export function pickChapterQuizSet(input: ChapterQuizInput): ConceptCheck[] {
  const { currentChapterChecks, priorChapterChecks, attemptHistory, seed } = input;
  if (currentChapterChecks.length === 0 && priorChapterChecks.length === 0) return [];

  const rng = makeRng(seed);

  const currentRanked = shuffle(rankByHistory(currentChapterChecks, attemptHistory), rng);
  const priorRanked = shuffle(rankByHistory(priorChapterChecks, attemptHistory), rng);

  const wantCurrent = Math.round(TARGET_SIZE * CURRENT_RATIO);
  const wantPrior = TARGET_SIZE - wantCurrent;

  const takeCurrent = Math.min(wantCurrent, currentRanked.length);
  const takePrior = Math.min(wantPrior, priorRanked.length);

  let chosen = [...currentRanked.slice(0, takeCurrent), ...priorRanked.slice(0, takePrior)];

  if (chosen.length < MIN_SIZE) {
    const currentExtra = currentRanked.slice(takeCurrent);
    const priorExtra = priorRanked.slice(takePrior);
    const extras = [...currentExtra, ...priorExtra];
    chosen = [...chosen, ...extras.slice(0, MAX_SIZE - chosen.length)];
  }

  return chosen.slice(0, MAX_SIZE);
}
