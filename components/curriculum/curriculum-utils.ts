import type { Node, Edge } from "@xyflow/react";
import type { Module, Stage } from "@/lib/dashboard/types";
import { STAGES } from "@/lib/dashboard/curriculum";

// ─── Constants ───────────────────────────────────────────────────────────────

const NODE_WIDTH = 200;
const NODE_HEIGHT = 100;
const H_GAP = 60;
const V_GAP = 120;
const STAGE_LABEL_HEIGHT = 40;

// ─── Types ───────────────────────────────────────────────────────────────────

export type ModuleStatus = "completed" | "active" | "not_started" | "locked";

export interface ModuleNodeData {
  title: string;
  completed: number;
  total: number;
  status: ModuleStatus;
  stage: Stage;
  moduleId: string;
  lessons: { id: string; title: string; slug: string; status: string }[];
  [key: string]: unknown;
}

// ─── Status derivation ───────────────────────────────────────────────────────

/**
 * Derives the visual status for a module node given its lessons' progress states
 * and whether the previous module has been completed.
 */
function deriveModuleStatus(
  lessons: Module["lessons"],
  lessonProgress: Record<string, string>,
  prevModuleCompleted: boolean,
): ModuleStatus {
  const statuses = lessons.map((l) => lessonProgress[l.id] ?? "not_started");

  const allDone = statuses.every((s) => s === "completed" || s === "skipped");
  if (allDone && lessons.length > 0) return "completed";

  const hasActivity = statuses.some(
    (s) => s === "in_progress" || s === "completed" || s === "skipped",
  );
  if (hasActivity) return "active";

  // No activity — decide locked vs. not_started
  const isLocked = !prevModuleCompleted;
  return isLocked ? "locked" : "not_started";
}

// ─── Edge helpers ─────────────────────────────────────────────────────────────

function edgeStyle(_status: ModuleStatus, targetStatus: ModuleStatus) {
  const isLockedEdge = targetStatus === "locked";

  return {
    stroke: isLockedEdge ? "var(--node-locked)" : "var(--color-brand-bright)",
    strokeDasharray: isLockedEdge ? "6 4" : undefined,
    strokeWidth: 2,
  };
}

// ─── Main builder ─────────────────────────────────────────────────────────────

export function buildFlowData(
  curriculum: Module[],
  lessonProgress: Record<string, string>,
): { nodes: Node<ModuleNodeData>[]; edges: Edge[] } {
  const nodes: Node<ModuleNodeData>[] = [];
  const edges: Edge[] = [];

  // Sort stages by their defined order
  const stagesOrdered = [...STAGES].sort((a, b) => a.order - b.order);

  // Group modules by stage, sorted by order within each stage
  const modulesByStage = new Map<Stage, Module[]>();
  for (const stage of stagesOrdered) {
    const stageModules = curriculum
      .filter((m) => m.stage === stage.id)
      .sort((a, b) => a.order - b.order);
    modulesByStage.set(stage.id, stageModules);
  }

  // Track all modules in curriculum order so we can determine prev-module status
  const allModulesOrdered = curriculum.slice().sort((a, b) => a.order - b.order);

  // Pre-compute each module's status (needs to know prior module's completion)
  const moduleStatusMap = new Map<string, ModuleStatus>();
  for (let i = 0; i < allModulesOrdered.length; i++) {
    const mod = allModulesOrdered[i]!;
    const prev = i === 0 ? null : allModulesOrdered[i - 1]!;
    const prevCompleted =
      prev == null ? true : moduleStatusMap.get(prev.id) === "completed";
    const status = deriveModuleStatus(mod.lessons, lessonProgress, prevCompleted);
    moduleStatusMap.set(mod.id, status);
  }

  // Build per-lesson progress lookup for node data
  function lessonStatus(lessonId: string): string {
    return lessonProgress[lessonId] ?? "not_started";
  }

  // Lay out nodes stage by stage, accumulating Y offset
  let currentY = 0;

  // Track last module of previous stage for inter-stage vertical edges
  let lastModuleOfPrevStage: Module | null = null;

  for (const stage of stagesOrdered) {
    const stageModules = modulesByStage.get(stage.id) ?? [];
    if (stageModules.length === 0) continue;

    // Reserve space for stage label
    currentY += STAGE_LABEL_HEIGHT;

    // Calculate row width and starting X so the row is centered at x=0
    const rowWidth =
      stageModules.length * NODE_WIDTH + (stageModules.length - 1) * H_GAP;
    const startX = -rowWidth / 2 + NODE_WIDTH / 2;

    // Create nodes for this stage row
    for (let i = 0; i < stageModules.length; i++) {
      const mod = stageModules[i]!;
      const status = moduleStatusMap.get(mod.id) ?? "not_started";
      const completedCount = mod.lessons.filter((l) => {
        const s = lessonProgress[l.id] ?? "not_started";
        return s === "completed" || s === "skipped";
      }).length;

      nodes.push({
        id: mod.id,
        type: "moduleNode",
        position: {
          x: startX + i * (NODE_WIDTH + H_GAP),
          y: currentY,
        },
        data: {
          title: mod.title,
          completed: completedCount,
          total: mod.lessons.length,
          status,
          stage: mod.stage,
          moduleId: mod.id,
          lessons: mod.lessons.map((l) => ({
            id: l.id,
            title: l.title,
            slug: l.slug,
            status: lessonStatus(l.id),
          })),
        },
      });
    }

    // Horizontal edges within this stage row
    for (let i = 0; i < stageModules.length - 1; i++) {
      const source = stageModules[i]!;
      const target = stageModules[i + 1]!;
      const sourceStatus = moduleStatusMap.get(source.id) ?? "not_started";
      const targetStatus = moduleStatusMap.get(target.id) ?? "not_started";
      const isActive = sourceStatus === "completed" || sourceStatus === "active";
      const isLocked = targetStatus === "locked";

      edges.push({
        id: `h-${source.id}-${target.id}`,
        source: source.id,
        target: target.id,
        type: "smoothstep",
        animated: isActive && !isLocked,
        style: edgeStyle(sourceStatus, targetStatus),
      });
    }

    // Vertical edge from last module of previous stage to first module of this stage
    if (lastModuleOfPrevStage !== null && stageModules.length > 0) {
      const source = lastModuleOfPrevStage;
      const target = stageModules[0]!;
      const sourceStatus = moduleStatusMap.get(source.id) ?? "not_started";
      const targetStatus = moduleStatusMap.get(target.id) ?? "not_started";
      const isActive = sourceStatus === "completed" || sourceStatus === "active";
      const isLocked = targetStatus === "locked";

      edges.push({
        id: `v-${source.id}-${target.id}`,
        source: source.id,
        target: target.id,
        type: "smoothstep",
        animated: isActive && !isLocked,
        style: edgeStyle(sourceStatus, targetStatus),
      });
    }

    lastModuleOfPrevStage = stageModules[stageModules.length - 1]!;
    currentY += NODE_HEIGHT + V_GAP;
  }

  return { nodes, edges };
}
