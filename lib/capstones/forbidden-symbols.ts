import type { Stage } from "@/lib/dashboard/types";

export interface ForbiddenPattern {
  label: string;
  pattern: RegExp;
}

/**
 * Per-stage list of forbidden C++ surface for capstone reference solutions.
 * The Basics capstone must not use vectors, classes, pointers, etc. — those
 * topics live in later stages of the curriculum.
 *
 * Patterns run against source with comments + string literals stripped so
 * keywords inside text content don't false-positive.
 */
export const FORBIDDEN_BY_STAGE: Record<Stage, ForbiddenPattern[]> = {
  basics: [
    { label: "std::vector", pattern: /\bstd::vector\b/ },
    { label: "std::array", pattern: /\bstd::array\b/ },
    { label: "class declaration", pattern: /\bclass\s+[A-Za-z_]/ },
    { label: "struct with methods", pattern: /\bstruct\s+[A-Za-z_][^;{]*\{[^}]*\([^)]*\)\s*\{/ },
    { label: "new expression", pattern: /\bnew\s+[A-Za-z_]/ },
    { label: "delete expression", pattern: /\bdelete\s+[A-Za-z_\[]/ },
    { label: "pointer declaration", pattern: /[A-Za-z_][A-Za-z0-9_]*\s*\*\s*[A-Za-z_]/ },
    { label: "reference declaration", pattern: /[A-Za-z_][A-Za-z0-9_]*\s*&\s*[A-Za-z_][A-Za-z0-9_]*\s*[=;,)]/ },
    { label: "smart pointer", pattern: /\bstd::(unique_ptr|shared_ptr|weak_ptr)\b/ },
    { label: "template", pattern: /\btemplate\s*</ },
    { label: "lambda", pattern: /\[[^\]]*\]\s*\([^)]*\)\s*\{/ },
    { label: "<algorithm>", pattern: /#\s*include\s*<algorithm>/ },
    { label: "virtual", pattern: /\bvirtual\b/ },
  ],
  "memory-oop": [
    { label: "std::vector", pattern: /\bstd::vector\b/ },
    { label: "std::array", pattern: /\bstd::array\b/ },
    { label: "iterator", pattern: /\b(begin|end|cbegin|cend)\s*\(/ },
    { label: "<algorithm>", pattern: /#\s*include\s*<algorithm>/ },
    { label: "smart pointer", pattern: /\bstd::(unique_ptr|shared_ptr|weak_ptr)\b/ },
    { label: "virtual", pattern: /\bvirtual\b/ },
    { label: "inheritance", pattern: /\bclass\s+[A-Za-z_][A-Za-z0-9_]*\s*:\s*(public|protected|private)\b/ },
    { label: "move/forward", pattern: /\bstd::(move|forward)\b/ },
    { label: "exceptions", pattern: /\b(throw|try|catch)\b/ },
    { label: "<fstream>", pattern: /#\s*include\s*<fstream>/ },
  ],
  "stl-templates": [
    { label: "std::unique_ptr", pattern: /\bstd::unique_ptr\b/ },
    { label: "std::shared_ptr", pattern: /\bstd::shared_ptr\b/ },
    { label: "std::weak_ptr", pattern: /\bstd::weak_ptr\b/ },
    { label: "virtual", pattern: /\bvirtual\b/ },
    { label: "inheritance", pattern: /\bclass\s+[A-Za-z_][A-Za-z0-9_]*\s*:\s*(public|protected|private)\b/ },
    { label: "move/forward", pattern: /\bstd::(move|forward)\b/ },
    { label: "exceptions", pattern: /\b(throw|try|catch)\b/ },
    { label: "<fstream>", pattern: /#\s*include\s*<fstream>/ },
  ],
  advanced: [],
};

/** Strip block comments, line comments, and string/char literals from C++ source. */
function stripCommentsAndStrings(code: string): string {
  let out = "";
  let i = 0;
  while (i < code.length) {
    const two = code.slice(i, i + 2);
    if (two === "/*") {
      const end = code.indexOf("*/", i + 2);
      i = end === -1 ? code.length : end + 2;
      continue;
    }
    if (two === "//") {
      const end = code.indexOf("\n", i + 2);
      i = end === -1 ? code.length : end;
      continue;
    }
    const ch = code[i];
    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      while (j < code.length && code[j] !== quote) {
        if (code[j] === "\\") j += 2;
        else j += 1;
      }
      i = j + 1;
      continue;
    }
    out += ch;
    i += 1;
  }
  return out;
}

export interface ForbiddenHit {
  label: string;
  match: string;
}

/**
 * Scan `code` for any forbidden patterns associated with `stage`. Returns the
 * list of distinct hits (deduplicated by label).
 */
export function findForbiddenUsages(stage: Stage, code: string): ForbiddenHit[] {
  const cleaned = stripCommentsAndStrings(code);
  const hits: ForbiddenHit[] = [];
  const seen = new Set<string>();
  for (const { label, pattern } of FORBIDDEN_BY_STAGE[stage]) {
    const m = cleaned.match(pattern);
    if (m && !seen.has(label)) {
      seen.add(label);
      hits.push({ label, match: m[0] });
    }
  }
  return hits;
}
