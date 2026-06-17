import { useState, type FormEvent } from "react";
import type { NewTeachingSemesterInput, TeachingTerm } from "../types";

type SemesterModalProps = {
  onClose: () => void;
  onSave: (input: NewTeachingSemesterInput) => void;
};

const termOptions: TeachingTerm[] = ["Fall", "Spring", "Summer", "Winter", "Other"];

export function SemesterModal({ onClose, onSave }: SemesterModalProps) {
  const currentYear = String(new Date().getFullYear());

  const [name, setName] = useState("");
  const [term, setTerm] = useState<TeachingTerm>("Fall");
  const [year, setYear] = useState(currentYear);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanedName = name.trim();

    if (!cleanedName) {
      return;
    }

    onSave({
      name: cleanedName,
      term,
      year,
      startDate,
      endDate,
      notes,
    });

    onClose();
  }

  return (
    <div className="teaching-modal-backdrop" role="presentation">
      <div className="teaching-modal" role="dialog" aria-modal="true">
        <div className="teaching-modal__header">
          <div>
            <p className="eyebrow">Teaching</p>
            <h2>New semester</h2>
            <p>Create the container first. Courses come next.</p>
          </div>

          <button type="button" onClick={onClose} aria-label="Close semester modal">
            ×
          </button>
        </div>

        <form className="teaching-modal__form" onSubmit={handleSubmit}>
          <label>
            <span>Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Fall 2026"
              autoFocus
            />
          </label>

          <div className="teaching-modal__row">
            <label>
              <span>Term</span>
              <select
                value={term}
                onChange={(event) => setTerm(event.target.value as TeachingTerm)}
              >
                {termOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Year</span>
              <input
                value={year}
                onChange={(event) => setYear(event.target.value)}
                placeholder="2026"
              />
            </label>
          </div>

          <div className="teaching-modal__row">
            <label>
              <span>Start date</span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>

            <label>
              <span>End date</span>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>
          </div>

          <label>
            <span>Notes</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Anything future-you needs to remember about this semester."
              rows={4}
            />
          </label>

          <div className="teaching-modal__actions">
            <button className="teaching-secondary-button" type="button" onClick={onClose}>
              Cancel
            </button>

            <button className="teaching-primary-button" type="submit">
              Add semester
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}