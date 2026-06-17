import { useMemo, useState } from "react";
import type { TeachingSuggestion } from "../types";

export type EditableTeachingSuggestion = TeachingSuggestion & {
  selected: boolean;
  alreadyCreated: boolean;
};

type TeachingSuggestionReviewProps = {
  suggestions: TeachingSuggestion[];
  isAlreadyCreated: (suggestion: TeachingSuggestion) => boolean;
  onClose: () => void;
  onCreateSelected: (suggestions: TeachingSuggestion[]) => void;
};

export function TeachingSuggestionReview({
  suggestions,
  isAlreadyCreated,
  onClose,
  onCreateSelected,
}: TeachingSuggestionReviewProps) {
  const [editableSuggestions, setEditableSuggestions] = useState<
    EditableTeachingSuggestion[]
  >(() =>
    suggestions.map((suggestion) => {
      const alreadyCreated = isAlreadyCreated(suggestion);

      return {
        ...suggestion,
        selected: suggestion.checkedByDefault && !alreadyCreated,
        alreadyCreated,
      };
    }),
  );
  const hasUndatedSuggestions = editableSuggestions.some(
    (suggestion) => !suggestion.suggestedDate,
  );
  const selectedCount = editableSuggestions.filter(
    (suggestion) => suggestion.selected && !suggestion.alreadyCreated,
  ).length;
  const createLabel = useMemo(
    () =>
      selectedCount === 1
        ? "Create 1 selected reminder"
        : `Create ${selectedCount} selected reminders`,
    [selectedCount],
  );

  function updateSuggestion(
    suggestionId: string,
    updater: (suggestion: EditableTeachingSuggestion) => EditableTeachingSuggestion,
  ) {
    setEditableSuggestions((currentSuggestions) =>
      currentSuggestions.map((suggestion) =>
        suggestion.id === suggestionId ? updater(suggestion) : suggestion,
      ),
    );
  }

  function selectAll() {
    setEditableSuggestions((currentSuggestions) =>
      currentSuggestions.map((suggestion) => ({
        ...suggestion,
        selected: !suggestion.alreadyCreated,
      })),
    );
  }

  function selectNone() {
    setEditableSuggestions((currentSuggestions) =>
      currentSuggestions.map((suggestion) => ({ ...suggestion, selected: false })),
    );
  }

  function handleCreateSelected() {
    const selectedSuggestions = editableSuggestions.filter(
      (suggestion) => suggestion.selected && !suggestion.alreadyCreated,
    );

    onCreateSelected(selectedSuggestions);
  }

  return (
    <div className="teaching-modal-backdrop" role="presentation">
      <div
        className="teaching-modal teaching-modal--wide"
        role="dialog"
        aria-modal="true"
      >
        <div className="teaching-modal__header">
          <div>
            <p className="eyebrow">Suggested follow-ups</p>
            <h2>Create Teaching reminders with consent</h2>
            <p>
              These are draft reminders from the assignment details. Pick the
              ones you want, adjust titles or dates, then create only those.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close suggestions">
            ×
          </button>
        </div>

        {hasUndatedSuggestions ? (
          <p className="teaching-form-warning">
            Some suggestions are undated because this item has no due date yet.
            You can add dates now or leave them blank.
          </p>
        ) : null}

        <div className="teaching-suggestion-actions">
          <button className="teaching-secondary-button" type="button" onClick={selectAll}>
            Select all
          </button>
          <button className="teaching-secondary-button" type="button" onClick={selectNone}>
            Select none
          </button>
        </div>

        <div className="teaching-suggestion-list">
          {editableSuggestions.map((suggestion) => (
            <article
              key={suggestion.id}
              className={
                suggestion.alreadyCreated
                  ? "teaching-suggestion-card teaching-suggestion-card--disabled"
                  : "teaching-suggestion-card"
              }
            >
              <label className="teaching-suggestion-card__check">
                <input
                  type="checkbox"
                  checked={suggestion.selected}
                  disabled={suggestion.alreadyCreated}
                  onChange={(event) =>
                    updateSuggestion(suggestion.id, (currentSuggestion) => ({
                      ...currentSuggestion,
                      selected: event.target.checked,
                    }))
                  }
                />
                <span>
                  <strong>{suggestion.kind}</strong>
                  {suggestion.alreadyCreated ? "Already created" : suggestion.targetType}
                </span>
              </label>

              <div className="teaching-suggestion-card__fields">
                <label>
                  <span>Title</span>
                  <input
                    value={suggestion.title}
                    disabled={suggestion.alreadyCreated}
                    onChange={(event) =>
                      updateSuggestion(suggestion.id, (currentSuggestion) => ({
                        ...currentSuggestion,
                        title: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  <span>Date</span>
                  <input
                    type="date"
                    value={suggestion.suggestedDate ?? ""}
                    disabled={suggestion.alreadyCreated}
                    onChange={(event) =>
                      updateSuggestion(suggestion.id, (currentSuggestion) => ({
                        ...currentSuggestion,
                        suggestedDate: event.target.value || undefined,
                      }))
                    }
                  />
                </label>
              </div>

              <p>{suggestion.description}</p>
              <p className="muted-text">{suggestion.reason}</p>
              <p className="muted-text">
                {suggestion.contextLabel}
                {suggestion.estimatedMinutes
                  ? ` · ${suggestion.estimatedMinutes} min`
                  : ""}
                {suggestion.lowEnergyFriendly ? " · low-energy friendly" : ""}
              </p>
            </article>
          ))}
        </div>

        <div className="teaching-modal__actions">
          <button className="teaching-secondary-button" type="button" onClick={onClose}>
            Skip for now
          </button>
          <button
            className="teaching-primary-button"
            type="button"
            disabled={selectedCount === 0}
            onClick={handleCreateSelected}
          >
            {createLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
