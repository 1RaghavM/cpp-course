import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { findForbiddenUsages, FORBIDDEN_BY_STAGE } from "@/lib/capstones/forbidden-symbols";
import type { CapstoneTestsFile, CapstoneSlug } from "@/lib/capstones/types";

const CAPSTONE_DIR = resolve(__dirname, "..", "..", "content", "capstones");

function loadAll(): Array<{ slug: CapstoneSlug; file: CapstoneTestsFile; md: string }> {
  return readdirSync(CAPSTONE_DIR)
    .filter((f) => f.endsWith(".tests.json"))
    .map((f) => {
      const slug = f.replace(".tests.json", "") as CapstoneSlug;
      const file = JSON.parse(readFileSync(join(CAPSTONE_DIR, f), "utf8")) as CapstoneTestsFile;
      const md = readFileSync(join(CAPSTONE_DIR, `${slug}.md`), "utf8");
      return { slug, file, md };
    });
}

describe("capstone content integrity", () => {
  const all = loadAll();

  it("ships 4 capstones (basics, memory-oop, stl-templates, advanced)", () => {
    const slugs = all.map((x) => x.slug).sort();
    expect(slugs).toEqual(["advanced", "basics", "memory-oop", "stl-templates"]);
  });

  for (const { slug, file, md } of all) {
    describe(slug, () => {
      it("has stage matching slug", () => {
        expect(file.stage).toBe(slug);
      });

      it("has exactly 5 milestones with IDs 1..5", () => {
        expect(file.milestones).toHaveLength(5);
        expect(file.milestones.map((m) => m.id)).toEqual([1, 2, 3, 4, 5]);
      });

      it("has ≥2 tests per milestone and ≥10 tests overall", () => {
        for (const m of file.milestones) {
          expect(m.tests.length).toBeGreaterThanOrEqual(2);
        }
        const total = file.milestones.reduce((s, m) => s + m.tests.length, 0);
        expect(total).toBeGreaterThanOrEqual(10);
      });

      it("reference_solution is 50–150 LOC", () => {
        const lines = file.reference_solution.split("\n").length;
        expect(lines).toBeGreaterThanOrEqual(50);
        expect(lines).toBeLessThanOrEqual(150);
      });

      it("reference_solution has no forbidden symbols for its stage", () => {
        const hits = findForbiddenUsages(slug, file.reference_solution);
        expect(hits, `forbidden hits in ${slug}: ${JSON.stringify(hits)}`).toEqual([]);
      });

      it("every milestone has a matching H2 heading in the markdown", () => {
        for (const m of file.milestones) {
          const numberedPattern = new RegExp(`^##\\s+Milestone\\s+${m.id}\\b`, "m");
          expect(numberedPattern.test(md), `missing H2 "Milestone ${m.id}" in ${slug}.md`).toBe(
            true,
          );
        }
      });

      it("FORBIDDEN_BY_STAGE includes this slug", () => {
        expect(FORBIDDEN_BY_STAGE[slug]).toBeDefined();
      });
    });
  }
});
