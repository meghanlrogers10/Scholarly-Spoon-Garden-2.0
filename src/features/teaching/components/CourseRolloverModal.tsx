import { useState, type FormEvent } from "react";
import type {
  TeachingCourse,
  TeachingCourseRolloverInput,
  TeachingSemester,
} from "../types";

type CourseRolloverModalProps = {
  courses: TeachingCourse[];
  semesters: TeachingSemester[];
  selectedCourse?: TeachingCourse;
  selectedSemesterId?: string;
  onClose: () => void;
  onSave: (input: TeachingCourseRolloverInput) => void;
};

export function CourseRolloverModal({
  courses,
  semesters,
  selectedCourse,
  selectedSemesterId,
  onClose,
  onSave,
}: CourseRolloverModalProps) {
  const [sourceCourseId, setSourceCourseId] = useState(
    selectedCourse?.id ?? courses[0]?.id ?? "",
  );
  const sourceCourse = courses.find((course) => course.id === sourceCourseId);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const semesterId = String(formData.get("semesterId") ?? "");
    const code = String(formData.get("code") ?? "").trim();
    const title = String(formData.get("title") ?? "").trim();

    if (!sourceCourseId || !semesterId || !code || !title) {
      setError("Choose a source course, semester, code, and title.");
      return;
    }

    onSave({
      sourceCourseId,
      semesterId,
      code,
      title,
      section: String(formData.get("section") ?? "").trim(),
      meetingPattern: String(formData.get("meetingPattern") ?? "").trim(),
      location: String(formData.get("location") ?? "").trim(),
      notes: String(formData.get("notes") ?? "").trim(),
      copyPrep: formData.get("copyPrep") === "on",
      copyResources: formData.get("copyResources") === "on",
      copyGradingCategories: formData.get("copyGradingCategories") === "on",
      copyNotes: formData.get("copyNotes") === "on",
    });
  }

  return (
    <div className="teaching-modal-backdrop" role="presentation">
      <div className="teaching-modal" role="dialog" aria-modal="true">
        <div className="teaching-modal__header">
          <div>
            <p className="eyebrow">Semester Rollover</p>
            <h2>Copy a course shell forward</h2>
            <p>Completed old tasks stay behind unless you recreate them later.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>

        <form className="teaching-modal__form" onSubmit={handleSubmit}>
          <div className="teaching-modal__row">
            <label>
              <span>Source course</span>
              <select
                value={sourceCourseId}
                onChange={(event) => setSourceCourseId(event.target.value)}
              >
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code}: {course.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>New semester</span>
              <select name="semesterId" defaultValue={selectedSemesterId ?? ""}>
                {semesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    {semester.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="teaching-modal__row">
            <label>
              <span>New course code</span>
              <input name="code" defaultValue={sourceCourse?.code ?? ""} />
            </label>
            <label>
              <span>New section</span>
              <input name="section" defaultValue={sourceCourse?.section ?? ""} />
            </label>
          </div>

          <label>
            <span>New course title</span>
            <input name="title" defaultValue={sourceCourse?.title ?? ""} />
          </label>

          <div className="teaching-modal__row">
            <label>
              <span>Meeting pattern</span>
              <input
                name="meetingPattern"
                defaultValue={sourceCourse?.meetingPattern ?? ""}
              />
            </label>
            <label>
              <span>Location</span>
              <input name="location" defaultValue={sourceCourse?.location ?? ""} />
            </label>
          </div>

          <label>
            <span>Notes</span>
            <textarea name="notes" rows={3} defaultValue={sourceCourse?.notes ?? ""} />
          </label>

          <div className="teaching-modal__checks">
            <label>
              <input name="copyPrep" type="checkbox" defaultChecked />
              Copy unfinished prep structure
            </label>
            <label>
              <input name="copyResources" type="checkbox" defaultChecked />
              Copy resources
            </label>
            <label>
              <input name="copyGradingCategories" type="checkbox" />
              Copy grading category shells
            </label>
            <label>
              <input name="copyNotes" type="checkbox" />
              Copy course notes
            </label>
          </div>

          {error ? <p className="teaching-form-error">{error}</p> : null}

          <div className="teaching-modal__actions">
            <button className="teaching-secondary-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="teaching-primary-button" type="submit">
              Create copied course
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
