import { useState, type FormEvent } from "react";
import type {
  NewTeachingCourseInput,
  TeachingCourseTemplate,
  TeachingSemester,
} from "../types";

type CourseModalProps = {
  semesters: TeachingSemester[];
  templates?: TeachingCourseTemplate[];
  selectedSemesterId?: string;
  onClose: () => void;
  onSave: (input: NewTeachingCourseInput) => void;
};

export function CourseModal({
  semesters,
  templates = [],
  selectedSemesterId,
  onClose,
  onSave,
}: CourseModalProps) {
  const [semesterId, setSemesterId] = useState(
    selectedSemesterId ?? semesters[0]?.id ?? ""
  );
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [section, setSection] = useState("");
  const [meetingPattern, setMeetingPattern] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  function applyTemplate(templateId: string) {
    const template = templates.find((item) => item.id === templateId);

    if (!template) {
      return;
    }

    setCode(template.codePattern ?? "");
    setTitle(template.titlePattern ?? "");
    setMeetingPattern(template.meetingPattern ?? "");
    setNotes(
      [
        template.notes,
        template.prepChecklist.length
          ? `Prep checklist:\n- ${template.prepChecklist.join("\n- ")}`
          : undefined,
        template.gradingCategories.length
          ? `Grading categories: ${template.gradingCategories.join(", ")}`
          : undefined,
        template.resourceCategories.length
          ? `Resource categories: ${template.resourceCategories.join(", ")}`
          : undefined,
        template.taSupported ? "TA-supported course shell" : undefined,
      ]
        .filter(Boolean)
        .join("\n\n"),
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!semesterId || !code.trim() || !title.trim()) {
      return;
    }

    onSave({
      semesterId,
      code,
      title,
      section,
      meetingPattern,
      location,
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
            <h2>New course</h2>
            <p>Add the course shell. Active tools come later.</p>
          </div>

          <button type="button" onClick={onClose} aria-label="Close course modal">
            ×
          </button>
        </div>

        <form className="teaching-modal__form" onSubmit={handleSubmit}>
          <label>
            <span>Semester</span>
            <select
              value={semesterId}
              onChange={(event) => setSemesterId(event.target.value)}
            >
              {semesters.map((semester) => (
                <option key={semester.id} value={semester.id}>
                  {semester.name}
                </option>
              ))}
            </select>
          </label>

          {templates.length > 0 ? (
            <label>
              <span>Start from template</span>
              <select
                defaultValue=""
                onChange={(event) => applyTemplate(event.target.value)}
              >
                <option value="">Choose a template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <div className="teaching-modal__row">
            <label>
              <span>Course code</span>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="CRIM 1447"
                autoFocus
              />
            </label>

            <label>
              <span>Section</span>
              <input
                value={section}
                onChange={(event) => setSection(event.target.value)}
                placeholder="0001"
              />
            </label>
          </div>

          <label>
            <span>Course title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Introduction to Criminology"
            />
          </label>

          <div className="teaching-modal__row">
            <label>
              <span>Meeting pattern</span>
              <input
                value={meetingPattern}
                onChange={(event) => setMeetingPattern(event.target.value)}
                placeholder="MWF 10:30–11:20"
              />
            </label>

            <label>
              <span>Location</span>
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                placeholder="Room/building"
              />
            </label>
          </div>

          <label>
            <span>Notes</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Prep concerns, course reminders, TA notes later..."
              rows={4}
            />
          </label>

          <div className="teaching-modal__actions">
            <button className="teaching-secondary-button" type="button" onClick={onClose}>
              Cancel
            </button>

            <button className="teaching-primary-button" type="submit">
              Add course
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
