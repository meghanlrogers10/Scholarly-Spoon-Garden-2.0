import type {
  DailyCheckIn,
  PlannedTaskBlock,
  PlanningMode,
  WorkingBlock,
} from "../../../shared/types/planning";
import type { Task } from "../../../shared/types/task";
import {
  getPlannedBlocksForWorkingBlock,
  getWorkingBlockRemainingMinutes,
} from "./plannedTaskBlocks";
import { isShutdownReviewTask } from "./shutdownReviewTask";
import { isTeachingWorkingBlock } from "./teachingScheduleBlocks";
import { getTaskEstimateMinutes, getTaskSpoonCost } from "./todayBuilder";

export type SuggestionReason =
  | "Already marked for today"
  | "Due today"
  | "Overdue"
  | "Due soon"
  | "Fits this block"
  | "Research push mode"
  | "Teaching survival mode"
  | "Service triage mode"
  | "Low spoon"
  | "Low-energy friendly"
  | "Short task"
  | "Deadline emergency"
  | "Small-task cleanup"
  | "Shutdown task"
  | "Has next action";

export type BlockSuggestion = {
  task: Task;
  workingBlockId: string;
  estimatedMinutes: number;
  spoonCost: number;
  score: number;
  reasons: SuggestionReason[];
};

export type SuggestedBlockPlan = {
  block: WorkingBlock;
  suggestions: BlockSuggestion[];
  remainingMinutes: number;
  targetMinutes: number;
};

export type BlockSuggestionsResult = {
  blockPlans: SuggestedBlockPlan[];
  couldNotFitTasks: Task[];
  warnings: string[];
};

function getDateDistanceInDays(date: string | undefined, todayDate: string) {
  if (!date) return undefined;

  const today = new Date(`${todayDate}T00:00:00`).getTime();
  const target = new Date(`${date}T00:00:00`).getTime();

  if (!Number.isFinite(target)) return undefined;

  return Math.round((target - today) / 86_400_000);
}

function getBufferMinutes(remainingMinutes: number) {
  if (remainingMinutes <= 20) return 0;

  return Math.max(5, Math.min(10, Math.round(remainingMinutes * 0.1)));
}

function addReason(reasons: SuggestionReason[], reason: SuggestionReason) {
  if (!reasons.includes(reason)) {
    reasons.push(reason);
  }
}

function scoreTask(
  task: Task,
  mode: PlanningMode,
  availableMinutes: number,
  todayDate: string,
) {
  const reasons: SuggestionReason[] = [];
  const estimate = getTaskEstimateMinutes(task);
  const spoonCost = getTaskSpoonCost(task);
  const distance = getDateDistanceInDays(task.dueDate, todayDate);
  let score = 0;

  if (task.today !== false) {
    score += 35;
    addReason(reasons, "Already marked for today");
  }
  if (distance !== undefined && distance < 0) {
    score += mode === "deadline-emergency" ? 70 : 36;
    addReason(reasons, "Overdue");
  }
  if (distance === 0) {
    score += mode === "deadline-emergency" ? 62 : 34;
    addReason(reasons, "Due today");
  }
  if (distance !== undefined && distance > 0 && distance <= 3) {
    score += mode === "deadline-emergency" ? 46 : 20;
    addReason(reasons, "Due soon");
  }
  if (task.nextAction) {
    score += 8;
    addReason(reasons, "Has next action");
  }
  if (spoonCost <= 2) {
    score += 5;
    addReason(reasons, "Low spoon");
  }
  if (task.lowEnergyFriendly) {
    score += mode === "low-energy" ? 18 : 6;
    addReason(reasons, "Low-energy friendly");
  }
  if (estimate <= 20) {
    score += 5;
    addReason(reasons, "Short task");
  }

  if (mode === "research-push" && task.area === "Research") {
    score += estimate >= 25 ? 26 : 16;
    addReason(reasons, "Research push mode");
  }
  if (
    mode === "teaching-survival" &&
    (task.area === "Teaching" ||
      task.taskType === "grading" ||
      task.taskType === "class-prep" ||
      task.source === "announcement" ||
      task.source === "ta-follow-up")
  ) {
    score += 26;
    addReason(reasons, "Teaching survival mode");
  }
  if (
    mode === "service-triage" &&
    (task.area === "Service" ||
      task.taskType === "service" ||
      task.taskType === "advising" ||
      task.source === "committee-item" ||
      task.source === "admin-other")
  ) {
    score += 26;
    addReason(reasons, "Service triage mode");
  }
  if (mode === "deadline-emergency" && distance !== undefined && distance <= 7) {
    score += 18;
    addReason(reasons, "Deadline emergency");
  }
  if (
    mode === "small-task-cleanup" &&
    (estimate <= 25 || spoonCost <= 2 || task.taskType === "email-admin")
  ) {
    score += 18;
    addReason(reasons, "Small-task cleanup");
  }
  if (isShutdownReviewTask(task)) {
    score += 12;
    addReason(reasons, "Shutdown task");
  }

  if (availableMinutes > 0 && estimate > availableMinutes && mode !== "deadline-emergency") {
    score -= 35;
  }
  if (mode === "low-energy" && spoonCost >= 4) {
    score -= 25;
  }

  return { estimate, spoonCost, score, reasons };
}

function isOpenCandidate(task: Task) {
  return task.status !== "done" && task.status !== "archived";
}

export function buildBlockSuggestions({
  tasks,
  dailyCheckIn,
  workingBlocks,
  plannedBlocks,
  planningMode,
  date,
}: {
  tasks: Task[];
  dailyCheckIn?: DailyCheckIn;
  workingBlocks: WorkingBlock[];
  plannedBlocks: PlannedTaskBlock[];
  planningMode: PlanningMode;
  date: string;
}): BlockSuggestionsResult {
  const warnings: string[] = [];
  const alreadyPlannedTaskIds = new Set(plannedBlocks.map((block) => block.taskId));
  const openTasks = tasks.filter(isOpenCandidate);
  const candidates = openTasks.filter((task) => !alreadyPlannedTaskIds.has(task.id));

  if (workingBlocks.length === 0) {
    warnings.push("No work blocks yet. Add blocks in Daily Check-In first.");
  }
  if (openTasks.length === 0) {
    warnings.push("No open tasks found.");
  }

  const blockPlans: SuggestedBlockPlan[] = [];
  const assignedTaskIds = new Set<string>();

  workingBlocks.forEach((block, blockIndex) => {
    if (isTeachingWorkingBlock(block)) {
      blockPlans.push({
        block,
        suggestions: [],
        remainingMinutes: 0,
        targetMinutes: 0,
      });
      return;
    }

    const remainingMinutes = getWorkingBlockRemainingMinutes(block, plannedBlocks);
    const targetMinutes = Math.max(0, remainingMinutes - getBufferMinutes(remainingMinutes));
    let usedMinutes = 0;
    const blockSuggestions: BlockSuggestion[] = [];
    const blockPlannedTasks = getPlannedBlocksForWorkingBlock(block.id, plannedBlocks);

    if (remainingMinutes < 0) {
      warnings.push(`${block.startTime}-${block.endTime} is already overplanned.`);
    }

    const scoredCandidates = candidates
      .filter((task) => !assignedTaskIds.has(task.id))
      .map((task) => {
        const scored = scoreTask(task, planningMode, Math.max(targetMinutes, remainingMinutes), date);
        const fits = scored.estimate <= Math.max(0, targetMinutes - usedMinutes);
        const isFinalBlock = blockIndex === workingBlocks.length - 1;

        if (fits) addReason(scored.reasons, "Fits this block");
        if (isShutdownReviewTask(task) && !isFinalBlock) scored.score -= 12;

        return {
          task,
          estimatedMinutes: scored.estimate,
          spoonCost: scored.spoonCost,
          score:
            scored.score +
            (fits ? 18 : planningMode === "deadline-emergency" ? -2 : -28) +
            (blockPlannedTasks.length === 0 ? 2 : 0),
          reasons: scored.reasons,
        };
      })
      .sort((a, b) => b.score - a.score);

    scoredCandidates.forEach((candidate) => {
      const wouldFit = usedMinutes + candidate.estimatedMinutes <= targetMinutes;
      const isUrgentOverflow =
        planningMode === "deadline-emergency" &&
        candidate.reasons.some((reason) =>
          reason === "Overdue" || reason === "Due today" || reason === "Due soon",
        );

      if (!wouldFit && !isUrgentOverflow) {
        return;
      }

      if (blockSuggestions.length >= 3) {
        return;
      }

      blockSuggestions.push({
        ...candidate,
        workingBlockId: block.id,
      });
      assignedTaskIds.add(candidate.task.id);
      usedMinutes += candidate.estimatedMinutes;
    });

    blockPlans.push({
      block,
      suggestions: blockSuggestions,
      remainingMinutes,
      targetMinutes,
    });
  });

  const couldNotFitTasks = candidates
    .filter((task) => !assignedTaskIds.has(task.id))
    .sort((a, b) => {
      const aScore = scoreTask(a, planningMode, 0, date).score;
      const bScore = scoreTask(b, planningMode, 0, date).score;

      return bScore - aScore;
    })
    .slice(0, 8);

  const suggestedMinutes = blockPlans.flatMap((plan) => plan.suggestions).reduce(
    (totalMinutes, suggestion) => totalMinutes + suggestion.estimatedMinutes,
    0,
  );
  const openMinutes = workingBlocks.reduce(
    (totalMinutes, block) =>
      totalMinutes + Math.max(0, getWorkingBlockRemainingMinutes(block, plannedBlocks)),
    0,
  );

  if (suggestedMinutes > openMinutes) {
    warnings.push("Suggestions exceed open time. Treat this as a triage draft.");
  }
  if (dailyCheckIn && candidates.length > 0 && couldNotFitTasks.length > 0) {
    warnings.push("Some open tasks did not fit today.");
  }

  return { blockPlans, couldNotFitTasks, warnings };
}
