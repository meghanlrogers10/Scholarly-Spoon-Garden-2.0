import { useMemo, useState } from "react";
import type { ResearchMindMapNode, ResearchMindMapNodeInput } from "../types";
import { useResearchStorageSync } from "./useResearchStorageSync";

const STORAGE_KEY = "ssg:researchMindMapNodes";

function loadNodes() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved) as ResearchMindMapNode[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

function saveNodes(nodes: ResearchMindMapNode[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
}

function createNodeId(projectId: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${projectId}-mindmap-node-${crypto.randomUUID()}`;
  }

  return `${projectId}-mindmap-node-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export function useResearchMindMap() {
  const [nodes, setNodes] = useState<ResearchMindMapNode[]>(loadNodes);

  function updateNodes(
    updater: (currentNodes: ResearchMindMapNode[]) => ResearchMindMapNode[]
  ) {
    setNodes((currentNodes) => {
      const updatedNodes = updater(currentNodes);
      saveNodes(updatedNodes);
      return updatedNodes;
    });
  }

  function refreshNodes() {
    setNodes(loadNodes());
  }

  useResearchStorageSync(STORAGE_KEY, refreshNodes);

  const nodesByProject = useMemo(() => {
    return nodes.reduce<Record<string, ResearchMindMapNode[]>>(
      (groups, node) => {
        if (!groups[node.projectId]) {
          groups[node.projectId] = [];
        }

        groups[node.projectId].push(node);
        return groups;
      },
      {}
    );
  }, [nodes]);

  function sortNodes(nodeList: ResearchMindMapNode[]) {
    return [...nodeList].sort((a, b) => {
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }

      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }

  function getNodesForProject(projectId: string) {
    return sortNodes(nodesByProject[projectId] ?? []);
  }

  function createNode(input: ResearchMindMapNodeInput) {
    const now = new Date().toISOString();

    const newNode: ResearchMindMapNode = {
      id: createNodeId(input.projectId),
      projectId: input.projectId,
      nodeType: input.nodeType,
      title: input.title.trim(),
      body: input.body?.trim() || undefined,
      sourceId: input.sourceId || undefined,
      sourceTitle: input.sourceTitle?.trim() || undefined,
      noteId: input.noteId || undefined,
      noteTitle: input.noteTitle?.trim() || undefined,
      synthesisSectionId: input.synthesisSectionId || undefined,
      synthesisSectionTitle: input.synthesisSectionTitle?.trim() || undefined,
      relatedThemes: input.relatedThemes ?? [],
      x: input.x,
      y: input.y,
      color: input.color?.trim() || undefined,
      pinned: input.pinned,
      createdAt: now,
      updatedAt: now,
    };

    updateNodes((currentNodes) => [newNode, ...currentNodes]);
  }

  function updateNode(nodeId: string, input: ResearchMindMapNodeInput) {
    const now = new Date().toISOString();

    updateNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              nodeType: input.nodeType,
              title: input.title.trim(),
              body: input.body?.trim() || undefined,
              sourceId: input.sourceId || undefined,
              sourceTitle: input.sourceTitle?.trim() || undefined,
              noteId: input.noteId || undefined,
              noteTitle: input.noteTitle?.trim() || undefined,
              synthesisSectionId: input.synthesisSectionId || undefined,
              synthesisSectionTitle:
                input.synthesisSectionTitle?.trim() || undefined,
              relatedThemes: input.relatedThemes ?? [],
              x: input.x ?? node.x,
              y: input.y ?? node.y,
              color: input.color?.trim() || node.color,
              pinned: input.pinned,
              updatedAt: now,
            }
          : node
      )
    );
  }

  function updateNodePosition(nodeId: string, x: number, y: number) {
    const now = new Date().toISOString();

    updateNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              x,
              y,
              updatedAt: now,
            }
          : node
      )
    );
  }

  function togglePinnedNode(nodeId: string) {
    const now = new Date().toISOString();

    updateNodes((currentNodes) =>
      currentNodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              pinned: !node.pinned,
              updatedAt: now,
            }
          : node
      )
    );
  }

  function deleteNode(nodeId: string) {
    updateNodes((currentNodes) =>
      currentNodes.filter((node) => node.id !== nodeId)
    );
  }

  function mergeNodes(importedNodes: ResearchMindMapNode[]) {
    updateNodes((currentNodes) => [...importedNodes, ...currentNodes]);
  }

  return {
    nodes,
    getNodesForProject,
    createNode,
    updateNode,
    updateNodePosition,
    togglePinnedNode,
    deleteNode,
    mergeNodes,
    refreshNodes,
  };
}
