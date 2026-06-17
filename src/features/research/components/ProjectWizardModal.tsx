import { useState, type FormEvent } from "react";
import type {
  NewResearchProjectInput,
  ResearchFocusLevel,
  ResearchProjectDuration,
} from "../types";

type ProjectWizardModalProps = {
  onClose: () => void;
  onCreateProject: (project: NewResearchProjectInput) => void;
};

function makeShortName(title: string) {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 8)
    .toUpperCase();
}

export function ProjectWizardModal({
  onClose,
  onCreateProject,
}: ProjectWizardModalProps) {
  const [title, setTitle] = useState("");
  const [shortName, setShortName] = useState("");
  const [description, setDescription] = useState("");
  const [targetJournal, setTargetJournal] = useState("");
  const [durationMonths, setDurationMonths] =
    useState<ResearchProjectDuration>(6);
  const [focusLevel, setFocusLevel] =
    useState<ResearchFocusLevel>("secondary");

function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanedTitle = title.trim();

    if (!cleanedTitle) {
      return;
    }

    onCreateProject({
      title: cleanedTitle,
      shortName: shortName.trim() || makeShortName(cleanedTitle),
      description,
      targetJournal,
      durationMonths,
      focusLevel,
    });

    onClose();
  }

  return (
    <div className="research-modal-backdrop" role="presentation">
      <div
        className="research-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-research-project-title"
      >
        <div className="research-modal__header">
          <div>
            <p className="eyebrow">New project</p>
            <h2 id="new-research-project-title">Plant a manuscript seed.</h2>
            <p>
              Keep this light. You are creating a container, not solving the
              whole project tonight.
            </p>
          </div>

          <button
            className="research-modal__close"
            type="button"
            onClick={onClose}
            aria-label="Close new project modal"
          >
            ×
          </button>
        </div>

        <form className="research-modal__form" onSubmit={handleSubmit}>
          <label>
            <span>Project title</span>
            <input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);

                if (!shortName) {
                  setShortName(makeShortName(event.target.value));
                }
              }}
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

          <div className="research-modal__row">
            <label>
              <span>Timeline</span>
              <select
                value={durationMonths}
                onChange={(event) =>
                  setDurationMonths(Number(event.target.value) as ResearchProjectDuration)
                }
              >
                <option value={3}>3 months</option>
                <option value={6}>6 months</option>
                <option value={9}>9 months</option>
                <option value={12}>12 months</option>
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
              Create project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
