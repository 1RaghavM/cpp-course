"use client";

import { useMemo, useState, useCallback } from "react";
import { ReactFlow, Background, Controls, type Node, type NodeMouseHandler } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import type { Module } from "@/lib/dashboard/types";
import { buildFlowData, type ModuleNodeData } from "./curriculum-utils";
import { ModuleNode } from "./ModuleNode";
import { ModuleSidebar } from "./LessonPopover";

const nodeTypes = { moduleNode: ModuleNode };

export interface CurriculumMapProps {
  curriculum: Module[];
  lessonProgress: Record<string, string>;
}

export function CurriculumMap({ curriculum, lessonProgress }: CurriculumMapProps) {
  const { nodes, edges } = useMemo(
    () => buildFlowData(curriculum, lessonProgress),
    [curriculum, lessonProgress],
  );

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const onNodeClick = useCallback<NodeMouseHandler>(
    (_event, node: Node) => {
      const data = node.data as ModuleNodeData;
      if (data.status === "locked") return;
      setSelectedNodeId((prev) => (prev === node.id ? null : node.id));
    },
    [],
  );

  const handleSidebarClose = useCallback(() => {
    setSelectedNodeId(null);
  }, []);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedData = selectedNode ? (selectedNode.data as ModuleNodeData) : null;

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnScroll
        zoomOnScroll
        minZoom={0.3}
        maxZoom={1.5}
        proOptions={{ hideAttribution: false }}
      >
        <Background gap={20} size={1} className="!bg-background" />
        <Controls showInteractive={false} className="!bg-card !border-border !shadow-md" />
      </ReactFlow>
      <ModuleSidebar
        data={selectedData}
        open={selectedNodeId !== null}
        onClose={handleSidebarClose}
      />
    </div>
  );
}
