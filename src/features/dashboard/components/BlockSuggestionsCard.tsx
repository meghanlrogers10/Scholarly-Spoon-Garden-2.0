import { useMemo, useState } from "react";
import type { Task } from "../../../shared/types/task";
import { Button } from "../../../shared/ui/Button";
import { Card } from "../../../shared/ui/Card";
import type { BlockSuggestionsResult } from "../utils/blockSuggestions";
import { formatWorkingBlockDuration } from "../utils/workingBlockCalendar";

type BlockSuggestionsCardProps = {
  result: BlockSuggestionsResult;
  onAcceptTask: (taskId: string, workingBlockId: string) => void;
};

export function BlockSuggestionsCard({
  result,
  onAcceptTask,
}: BlockSuggestionsCardProps) {
  const [skippedTaskIds, setSkippedTaskIds] = useState<string[]>([]);
  const skippedTaskIdSet = useMemo(
    () => new Set(skippedTaskIds),
    [skippedTaskIds],
  );
  const hasSuggestions = result.blockPlans.some(
    (plan) =>
      plan.suggestions.filter((suggestion) => !skippedTaskIdSet.has(suggestion.task.id))
        .length > 0,
  );

  function handleSkip(task: Task) {
    setSkippedTaskIds((currentIds) =>
      currentIds.includes(task.id) ? currentIds : [...currentIds, task.id],
    );
  }

  function handleAcceptBlockPlan(workingBlockId: string) {
    const plan = result.blockPlans.find((item) => item.block.id === workingBlockId);

    plan?.suggestions
      .filter((suggestion) => !skippedTaskIdSet.has(suggestion.task.id))
      .forEach((suggestion) => onAcceptTask(suggestion.task.id, workingBlockId));
  }

  return (
    <Card className="block-suggestions-card">
      <div className="card-heading-row">
        <div>
          <p className="eyebrow">Block suggestions</p>
          <h2>Suggested for Your Blocks</h2>
          <p className="muted-text">
            A first-pass fit based on mode, due dates, spoons, estimates, and
            open block time.
          </p>
        </div>
      </div>

      {result.warnings.length > 0 ? (
        <div className="block-suggestion-warnings">
          {result.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      {!hasSuggestions ? (
        <p className="muted-text">
          No suggestions yet. Add work blocks and open tasks, then generate a
          fit.
        </p>
      ) : (
        <div className="block-suggestion-list">
          {result.blockPlans.map((plan) => {
            const visibleSuggestions = plan.suggestions.filter(
              (suggestion) => !skippedTaskIdSet.has(suggestion.task.id),
            );

            return (
              <section key={plan.block.id} className="block-suggestion-plan">
                <div className="block-suggestion-plan-header">
                  <div>
                    <p className="work-block-kicker">Suggested for this block</p>
                    <h3>
                      {plan.block.startTime}-{plan.block.endTime}
                    </h3>
                    <p className="muted-text">
                      {formatWorkingBlockDuration(Math.max(plan.remainingMinutes, 0))}{" "}
                      open, target{" "}
                      {formatWorkingBlockDuration(Math.max(plan.targetMinutes, 0))}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="soft"
                    disabled={visibleSuggestions.length === 0}
                    onClick={() => handleAcceptBlockPlan(plan.block.id)}
                  >
                    Accept block plan
                  </Button>
                </div>

                {visibleSuggestions.length === 0 ? (
                  <p className="muted-text">No suggested tasks for this block.</p>
                ) : (
                  <div className="block-suggestion-task-list">
                    {visibleSuggestions.map((suggestion) => (
                      <article
                        key={`${plan.block.id}-${suggestion.task.id}`}
                        className="block-suggestion-task"
                      >
                        <div>
                          <strong>{suggestion.task.title}</strong>
                          <p>
                            {suggestion.task.area} ·{" "}
                            {formatWorkingBlockDuration(suggestion.estimatedMinutes)} ·{" "}
                            {suggestion.spoonCost} spoons
                          </p>
                          <div className="block-suggestion-reasons">
                            {suggestion.reasons.slice(0, 4).map((reason) => (
                              <span key={reason}>{reason}</span>
                            ))}
                          </div>
                        </div>

                        <div className="block-suggestion-actions">
                          <Button
                            type="button"
                            variant="soft"
                            onClick={() =>
                              onAcceptTask(suggestion.task.id, plan.block.id)
                            }
                          >
                            Accept task
                          </Button>
                          <button
                            className="text-button"
                            type="button"
                            onClick={() => handleSkip(suggestion.task)}
                          >
                            Skip
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {result.couldNotFitTasks.length > 0 ? (
        <section className="could-not-fit-section">
          <h3>Could not fit today</h3>
          <div className="could-not-fit-list">
            {result.couldNotFitTasks.map((task) => (
              <span key={task.id}>{task.title}</span>
            ))}
          </div>
        </section>
      ) : null}
    </Card>
  );
}
