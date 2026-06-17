import {
  MINDSPACE_GOALS_STORAGE_KEY,
  MINDSPACE_ITEMS_STORAGE_KEY,
} from "../../../shared/constants/mindspaceStorage";
import { useLocalStorage } from "../../../shared/hooks/useLocalStorage";
import type {
  GoalStatus,
  GoalTimeHorizon,
  MindspaceConversionTarget,
  MindspaceGoal,
  MindspaceItem,
  MindspaceItemArea,
  MindspaceItemKind,
  MindspaceItemStatus,
} from "../types";

type MindspaceItemInput = {
  title: string;
  body?: string;
  kind?: MindspaceItemKind;
  area?: MindspaceItemArea;
};

type MindspaceGoalInput = {
  title: string;
  description?: string;
  horizon: GoalTimeHorizon;
  parentGoalId?: string;
  nextAction?: string;
  tinyStep?: string;
};

const itemStatuses: MindspaceItemStatus[] = [
  "inbox",
  "clarify-later",
  "converted",
  "released",
  "archived",
];

const itemKinds: MindspaceItemKind[] = [
  "thought",
  "worry",
  "idea",
  "reminder",
  "question",
  "goal-seed",
  "avoidance",
  "other",
];

const itemAreas: MindspaceItemArea[] = [
  "research",
  "teaching",
  "service",
  "personal",
  "mindspace",
  "other",
];

const goalStatuses: GoalStatus[] = ["active", "paused", "completed", "archived"];
const goalHorizons: GoalTimeHorizon[] = ["long-term", "semester", "month", "week"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const values = value.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0,
  );

  return values.length > 0 ? values : undefined;
}

function asItemStatus(value: unknown): MindspaceItemStatus {
  if (itemStatuses.includes(value as MindspaceItemStatus)) {
    return value as MindspaceItemStatus;
  }

  if (value === "parked") return "clarify-later";
  if (value === "actionable") return "inbox";
  if (value === "resolved") return "released";

  return "inbox";
}

function asItemKind(value: unknown): MindspaceItemKind {
  if (itemKinds.includes(value as MindspaceItemKind)) {
    return value as MindspaceItemKind;
  }

  if (value === "loop") return "avoidance";
  if (value === "decision" || value === "boundary" || value === "parking-lot") {
    return "thought";
  }

  return "thought";
}

function asItemArea(value: unknown): MindspaceItemArea {
  if (itemAreas.includes(value as MindspaceItemArea)) {
    return value as MindspaceItemArea;
  }

  if (value === "career" || value === "admin" || value === "recovery") {
    return "personal";
  }

  return "mindspace";
}

function asEmotionalWeight(value: unknown): MindspaceItem["emotionalWeight"] {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5
    ? value
    : undefined;
}

function asGoalStatus(value: unknown): GoalStatus {
  if (goalStatuses.includes(value as GoalStatus)) {
    return value as GoalStatus;
  }

  if (value === "done-enough") return "completed";
  if (value === "seed" || value === "warming-up" || value === "in-motion") {
    return "active";
  }

  return "active";
}

function asGoalHorizon(value: unknown): GoalTimeHorizon {
  if (goalHorizons.includes(value as GoalTimeHorizon)) {
    return value as GoalTimeHorizon;
  }

  if (value === "monthly") return "month";
  if (value === "weekly") return "week";

  return "week";
}

function normalizeItem(value: unknown): MindspaceItem | null {
  if (!isRecord(value)) {
    return null;
  }

  const title = asString(value.title);

  if (!title) {
    return null;
  }

  const now = new Date().toISOString();
  const createdAt = asString(value.createdAt) ?? now;
  const emotionalWeight =
    asEmotionalWeight(value.emotionalWeight) ?? asEmotionalWeight(value.emotionalLoad);

  return {
    id: asString(value.id) ?? crypto.randomUUID(),
    title,
    body: asString(value.body),
    kind: asItemKind(value.kind ?? value.type),
    area: asItemArea(value.area),
    status: asItemStatus(value.status),
    nextAction: asString(value.nextAction),
    tinyStep: asString(value.tinyStep),
    emotionalWeight,
    lowEnergyFriendly:
      typeof value.lowEnergyFriendly === "boolean"
        ? value.lowEnergyFriendly
        : undefined,
    convertedToType: asString(value.convertedToType) as
      | MindspaceConversionTarget
      | undefined,
    convertedToId: asString(value.convertedToId),
    createdAt,
    updatedAt: asString(value.updatedAt) ?? createdAt,
    lastTouchedAt: asString(value.lastTouchedAt),
  };
}

function normalizeGoal(value: unknown): MindspaceGoal | null {
  if (!isRecord(value)) {
    return null;
  }

  const title = asString(value.title);

  if (!title) {
    return null;
  }

  const now = new Date().toISOString();
  const createdAt = asString(value.createdAt) ?? now;

  return {
    id: asString(value.id) ?? crypto.randomUUID(),
    title,
    description: asString(value.description) ?? asString(value.whyItMatters),
    horizon: asGoalHorizon(value.horizon),
    status: asGoalStatus(value.status),
    parentGoalId: asString(value.parentGoalId),
    nextAction: asString(value.nextAction),
    tinyStep: asString(value.tinyStep),
    linkedTaskIds: asStringArray(value.linkedTaskIds),
    createdAt,
    updatedAt: asString(value.updatedAt) ?? createdAt,
  };
}

function normalizeItems(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeItem)
    .filter((item): item is MindspaceItem => Boolean(item));
}

function normalizeGoals(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeGoal)
    .filter((goal): goal is MindspaceGoal => Boolean(goal));
}

export function useMindspace() {
  const [storedItems, setStoredItems] = useLocalStorage<unknown[]>(
    MINDSPACE_ITEMS_STORAGE_KEY,
    [],
  );
  const [storedGoals, setStoredGoals] = useLocalStorage<unknown[]>(
    MINDSPACE_GOALS_STORAGE_KEY,
    [],
  );
  const items = normalizeItems(storedItems);
  const goals = normalizeGoals(storedGoals);

  function addBrainDumpItem(input: MindspaceItemInput) {
    const now = new Date().toISOString();
    const newItem: MindspaceItem = {
      id: crypto.randomUUID(),
      title: input.title,
      body: input.body,
      kind: input.kind ?? "thought",
      area: input.area ?? "mindspace",
      status: "inbox",
      createdAt: now,
      updatedAt: now,
      lastTouchedAt: now,
    };

    setStoredItems((currentValue) => [newItem, ...normalizeItems(currentValue)]);
  }

  function updateItem(id: string, updates: Partial<MindspaceItem>) {
    const now = new Date().toISOString();

    setStoredItems((currentValue) =>
      normalizeItems(currentValue).map((item) =>
        item.id === id
          ? {
              ...item,
              ...updates,
              id: item.id,
              updatedAt: now,
              lastTouchedAt: now,
            }
          : item,
      ),
    );
  }

  function releaseItem(id: string) {
    updateItem(id, { status: "released", convertedToType: "release" });
  }

  function archiveItem(id: string) {
    updateItem(id, { status: "archived" });
  }

  function moveItemToClarifyLater(id: string) {
    updateItem(id, { status: "clarify-later" });
  }

  function markItemConverted(
    id: string,
    convertedToType: MindspaceConversionTarget,
    convertedToId?: string,
  ) {
    updateItem(id, {
      status: "converted",
      convertedToType,
      convertedToId,
    });
  }

  function addGoal(input: MindspaceGoalInput) {
    const now = new Date().toISOString();
    const newGoal: MindspaceGoal = {
      id: crypto.randomUUID(),
      title: input.title,
      description: input.description,
      horizon: input.horizon,
      status: "active",
      parentGoalId: input.parentGoalId,
      nextAction: input.nextAction,
      tinyStep: input.tinyStep,
      createdAt: now,
      updatedAt: now,
    };

    setStoredGoals((currentValue) => [newGoal, ...normalizeGoals(currentValue)]);
  }

  function updateGoal(id: string, updates: Partial<MindspaceGoal>) {
    const now = new Date().toISOString();

    setStoredGoals((currentValue) =>
      normalizeGoals(currentValue).map((goal) =>
        goal.id === id
          ? {
              ...goal,
              ...updates,
              id: goal.id,
              updatedAt: now,
            }
          : goal,
      ),
    );
  }

  function archiveGoal(id: string) {
    updateGoal(id, { status: "archived" });
  }

  return {
    items,
    goals,
    addBrainDumpItem,
    updateItem,
    releaseItem,
    archiveItem,
    moveItemToClarifyLater,
    markItemConverted,
    addGoal,
    updateGoal,
    archiveGoal,
  };
}
