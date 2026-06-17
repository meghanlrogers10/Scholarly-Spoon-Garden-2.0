import { useState, type FormEvent } from "react";
import { researchStages } from "../data/researchStages";
import type {
  ResearchFocusLevel,
  ResearchProject,
  ResearchProjectDuration,
  ResearchStageKey,
  UpdateResearchProjectInput,
} from "../types";

type ProjectEditModalProps = {
  project: ResearchProject;
  onClose: () => void;
  onSaveProject: (project: UpdateResearchProjectInput) => void;
};

const stageOptions = Object.entries(researchStages) as Array<
  [ResearchStageKey, string]
>;

export function ProjectEditModal({
  project,
  onClose,
  onSaveProject,
}: ProjectEditModalProps) {
  const [title, setTitle] = useState(project.title);
  const [shortName, setShortName] = useState(project.shortName);
  const [description, setDescription] = useState(project.description);
  const [targetJournal, setTargetJournal] = useState(project.targetJournal ?? "");
  const [nextAction, setNextAction] = useState(project.nextAction);
  const [dueDate, setDueDate] = useState(project.dueDate ?? "");
  const [durationMonths, setDurationMonths] =
    useState<ResearchProjectDuration>(project.durationMonths ?? 6);
  const [focusLevel, setFocusLevel] = useState<ResearchFocusLevel>(
    project.focusLevel
  );
  const [currentStage, setCurrentStage] = useState<ResearchStageKey>(
    project.currentStage
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanedTitle = title.trim();
    const cleanedShortName = shortName.trim();

    if (!cleanedTitle || !cleanedShortName) {
      return;
    }

    onSaveProject({
      id: project.id,
      title: cleanedTitle,
      shortName: cleanedShortName,
      description,
      focusLevel,
      currentStage,
      targetJournal,
      nextAction,
      dueDate,
      durationMonths,
    });

    onClose();
  }

  return (
    <div className="research-modal-backdrop" role="presentation">
      <div
        className="research-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-research-project-title"
      >
        <div className="research-modal__header">
          <div>
            <p className="eyebrow">Edit project</p>
            <h2 id="edit-research-project-title">Update the project map.</h2>
            <p>
              Keep this practical. The most important field is the next action.
            </p>
          </div>

          <button
            className="research-modal__close"
            type="button"
            onClick={onClose}
            aria-label="Close edit project modal"
          >
            ×
          </button>
        </div>

        <form className="research-modal__form" onSubmit={handleSubmit}>
          <label>
            <span>Project title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Structural Capability Deficit"
              autoFocus
            />
          </label>

          <label>
            <span>Short name</span>
            <input
              value={shortName}
              onChange={(event) => setShortName(event.target.value)}
              placeholder="SCD"
            />
          </label>

          <label>
            <span>Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What is this project supposed to become?"
              rows={4}
            />
          </label>

          <label>
            <span>Next action</span>
            <input
              value={nextAction}
              onChange={(event) => setNextAction(event.target.value)}
              placeholder="Write the next concrete step."
            />
          </label>

          <div className="research-modal__row">
            <label>
              <span>Current stage</span>
              <select
                value={currentStage}
                onChange={(event) =>
                  setCurrentStage(event.target.value as ResearchStageKey)
                }
              >
                {stageOptions.map(([stageKey, label]) => (
                  <option key={stageKey} value={stageKey}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Focus level</span>
              <select
                value={focusLevel}
                onChange={(event) =>
                  setFocusLevel(event.target.value as ResearchFocusLevel)
                }
              >
                <option value="primary">Primary focus</option>
                <option value="secondary">Secondary</option>
                <option value="paused">Paused</option>
              </select>
            </label>
          </div>

          <div className="research-modal__row">
            <label>
              <span>Timeline</span>
              <select
                value={durationMonths}
                onChange={(event) =>
                  setDurationMonths(
                    Number(event.target.value) as ResearchProjectDuration
                  )
                }
              >
                <option value={3}>3 months</option>
                <option value={6}>6 months</option>
                <option value={9}>9 months</option>
                <option value={12}>12 months</option>
              </select>
            </label>

            <label>
              <span>Due date</span>
              <input
                type="date"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </label>
          </div>

          <label>
            <span>Target journal, optional</span>
            <input
              value={targetJournal}
              onChange={(event) => setTargetJournal(event.target.value)}
              placeholder="Criminology"
            />
          </label>

          <div className="research-modal__actions">
            <button
              className="research-secondary-button"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button className="research-primary-button" type="submit">
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
