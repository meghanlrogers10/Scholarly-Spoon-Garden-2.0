import { useState, type FormEvent } from "react";

const weekdays = [
  { label: "Monday", value: 1 },
  { label: "Tuesday", value: 2 },
  { label: "Wednesday", value: 3 },
  { label: "Thursday", value: 4 },
  { label: "Friday", value: 5 },
];

export type GenerateScheduleInput = {
  startDate: string;
  endDate: string;
  weekdays: number[];
  startingWeek: number;
  skipExistingDates: boolean;
};

type GenerateScheduleModalProps = {
  onClose: () => void;
  onGenerate: (input: GenerateScheduleInput) => void;
};

export function GenerateScheduleModal({
  onClose,
  onGenerate,
}: GenerateScheduleModalProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1, 3]);
  const [startingWeek, setStartingWeek] = useState(1);
  const [skipExistingDates, setSkipExistingDates] = useState(true);
  const [error, setError] = useState("");

  function toggleWeekday(value: number) {
    setSelectedWeekdays((currentWeekdays) =>
      currentWeekdays.includes(value)
        ? currentWeekdays.filter((weekday) => weekday !== value)
        : [...currentWeekdays, value].sort((a, b) => a - b)
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submittedStartDate = String(formData.get("startDate") ?? "");
    const submittedEndDate = String(formData.get("endDate") ?? "");
    const submittedWeekdays = formData
      .getAll("weekdays")
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value));
    const submittedStartingWeek =
      Number(formData.get("startingWeek") ?? "") || 1;

    if (!submittedStartDate || !submittedEndDate) {
      setError("Choose a start and end date.");
      return;
    }

    if (submittedStartDate > submittedEndDate) {
      setError("Start date needs to be before the end date.");
      return;
    }

    if (submittedWeekdays.length === 0) {
      setError("Choose at least one class weekday.");
      return;
    }

    onGenerate({
      startDate: submittedStartDate,
      endDate: submittedEndDate,
      weekdays: submittedWeekdays,
      startingWeek: submittedStartingWeek,
      skipExistingDates: formData.get("skipExistingDates") === "on",
    });
  }

  return (
    <div className="teaching-modal-backdrop" role="presentation">
      <div className="teaching-modal" role="dialog" aria-modal="true">
        <div className="teaching-modal__header">
          <div>
            <p className="eyebrow">Generate schedule</p>
            <h2>Create semester meeting rows</h2>
            <p>Pick the date range and recurring weekdays for this course.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <form className="teaching-modal__form" onSubmit={handleSubmit}>
          <div className="teaching-modal__row">
            <label>
              <span>Start date</span>
              <input
                name="startDate"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </label>
            <label>
              <span>End date</span>
              <input
                name="endDate"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </label>
          </div>

          <div className="teaching-weekday-grid" aria-label="Class weekdays">
            {weekdays.map((weekday) => (
              <label key={weekday.value} className="teaching-checkbox-row">
                <input
                  name="weekdays"
                  value={weekday.value}
                  type="checkbox"
                  checked={selectedWeekdays.includes(weekday.value)}
                  onChange={() => toggleWeekday(weekday.value)}
                />
                <span>{weekday.label}</span>
              </label>
            ))}
          </div>

          <div className="teaching-modal__row">
            <label>
              <span>Starting week</span>
              <input
                name="startingWeek"
                type="number"
                min="1"
                value={startingWeek}
                onChange={(event) =>
                  setStartingWeek(Number(event.target.value) || 1)
                }
              />
            </label>
            <label className="teaching-checkbox-row teaching-checkbox-row--padded">
              <input
                name="skipExistingDates"
                type="checkbox"
                checked={skipExistingDates}
                onChange={(event) => setSkipExistingDates(event.target.checked)}
              />
              <span>Skip existing dates</span>
            </label>
          </div>

          {error ? <p className="teaching-form-error">{error}</p> : null}

          <div className="teaching-modal__actions">
            <button
              className="teaching-secondary-button"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="teaching-primary-button" type="submit">
              Generate rows
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
