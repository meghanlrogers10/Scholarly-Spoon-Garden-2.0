import { Link, useParams } from "react-router-dom";
import { TeachingCourseSubnav } from "../components/TeachingCourseSubnav";
import { TeachingWorkspaceTile } from "../components/TeachingWorkspaceTile";
import { useTeaching } from "../hooks/useTeaching";
import "./teaching.css";

type TeachingToolKind =
  | "notebook"
  | "class-prep"
  | "grading"
  | "office-hours"
  | "ta"
  | "notes"
  | "resources";

const toolCopy: Record<
  TeachingToolKind,
  {
    eyebrow: string;
    title: string;
    description: string;
    futureTools: Array<{
      title: string;
      description: string;
      meta: string;
    }>;
  }
> = {
  notebook: {
    eyebrow: "Class Notebook",
    title: "Class Notebook",
    description:
      "Class meetings, schedule notes, readings, due items, cancellations, and changes for next time.",
    futureTools: [
      {
        title: "Class Schedule",
        description: "Meeting-by-meeting topics, readings, due items, and notes.",
        meta: "Planned",
      },
      {
        title: "Change Next Time",
        description: "Fast capture for what future-you should adjust.",
        meta: "Planned",
      },
      {
        title: "Canceled / Shifted Classes",
        description: "Track disruptions without losing the thread.",
        meta: "Planned",
      },
    ],
  },
  "class-prep": {
    eyebrow: "Class Prep",
    title: "Class Prep",
    description:
      "Plan class meetings, prep notes, lecture flow, activities, reminders, and what needs to change next time.",
    futureTools: [
      {
        title: "Meeting Plans",
        description: "Individual class sessions, prep notes, and lecture flow.",
        meta: "Planned",
      },
      {
        title: "Prep Queue",
        description: "Slides, readings, activities, examples, and reminders.",
        meta: "Planned",
      },
      {
        title: "After-Class Notes",
        description: "What worked, what bombed, and what to change next time.",
        meta: "Planned",
      },
    ],
  },
  grading: {
    eyebrow: "Grading",
    title: "Grading",
    description:
      "Assignments, grading queues, rubric reminders, return plans, and low-spoon grading strategy.",
    futureTools: [
      {
        title: "Assignments",
        description: "Track grading batches, due dates, and return targets.",
        meta: "Planned",
      },
      {
        title: "Rubric Notes",
        description: "Store rubric reminders and common feedback language.",
        meta: "Planned",
      },
      {
        title: "Return Plan",
        description: "Keep grading realistic instead of letting it become fog.",
        meta: "Planned",
      },
    ],
  },
  "office-hours": {
    eyebrow: "Office Hours",
    title: "Office Hours",
    description:
      "Student meeting notes, follow-ups, recurring issues, and reminders.",
    futureTools: [
      {
        title: "Student Meetings",
        description: "Meeting notes and follow-up reminders.",
        meta: "Planned",
      },
      {
        title: "Patterns",
        description: "Common student concerns, confusion points, and fixes.",
        meta: "Planned",
      },
      {
        title: "Follow-Up Queue",
        description: "Emails, referrals, and tasks after meetings.",
        meta: "Planned",
      },
    ],
  },
  ta: {
    eyebrow: "TA Follow-Up",
    title: "TA Follow-Up",
    description:
      "TA check-ins, grading calibration, delegation, and things that need a nudge.",
    futureTools: [
      {
        title: "Check-Ins",
        description: "TA meeting notes and follow-up items.",
        meta: "Planned",
      },
      {
        title: "Grading Calibration",
        description: "Rubric alignment, sample grading, and consistency notes.",
        meta: "Planned",
      },
      {
        title: "Delegation",
        description: "Who is doing what, by when, and what needs checking.",
        meta: "Planned",
      },
    ],
  },
  notes: {
    eyebrow: "Course Notes",
    title: "Course Notes",
    description:
      "Loose course thoughts, recurring issues, teaching reflections, and future-semester reminders.",
    futureTools: [
      {
        title: "Loose Notes",
        description: "Fast capture for course thoughts and reminders.",
        meta: "Planned",
      },
      {
        title: "Future Me",
        description: "What to change before teaching this again.",
        meta: "Planned",
      },
      {
        title: "Course Debrief",
        description: "End-of-semester notes without pretending memory will work.",
        meta: "Planned",
      },
    ],
  },
  resources: {
    eyebrow: "Resources",
    title: "Resources",
    description:
      "Slides, rubrics, readings, assignments, examples, and reusable teaching links.",
    futureTools: [
      {
        title: "Resource Library",
        description: "Reusable course materials and links.",
        meta: "Planned",
      },
      {
        title: "Assignment Materials",
        description: "Prompts, rubrics, examples, and feedback resources.",
        meta: "Planned",
      },
      {
        title: "Lecture Assets",
        description: "Slides, examples, activities, and reference links.",
        meta: "Planned",
      },
    ],
  },
};

type TeachingToolPlaceholderPageProps = {
  toolKind: TeachingToolKind;
};

function TeachingToolPlaceholderPage({
  toolKind,
}: TeachingToolPlaceholderPageProps) {
  const { courseId } = useParams();
  const { getCourseById, getSemesterById } = useTeaching();

  const course = getCourseById(courseId);
  const semester = course ? getSemesterById(course.semesterId) : undefined;
  const copy = toolCopy[toolKind];

  if (!course) {
    return (
      <section className="teaching-page page-stack">
        <div className="teaching-hero-panel">
          <div>
            <p className="eyebrow">Teaching</p>
            <h1>Course not found.</h1>
            <p>This course may have been archived, deleted, or not created yet.</p>
          </div>

          <Link className="teaching-secondary-button" to="/teaching">
            ← Back to Teaching
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="teaching-page page-stack">
      <div className="teaching-hero-panel">
        <div>
          <Link className="teaching-secondary-link" to={`/teaching/${course.id}`}>
            ← Back to {course.code}
          </Link>

          <p className="eyebrow">
            {semester ? `${semester.term} ${semester.year}` : "Teaching"} ·{" "}
            {copy.eyebrow}
          </p>

          <h1>{copy.title}</h1>

          <p>{copy.description}</p>
        </div>

        <div className="teaching-course-hero__status">
          <span>Course</span>
          <strong>{course.code}</strong>

          <span>Status</span>
          <strong>Shell only</strong>
        </div>
      </div>

      <TeachingCourseSubnav courseId={course.id} />

      <div className="teaching-tool-placeholder-panel">
        <p className="eyebrow">Planned tool</p>
        <h2>This workspace is routed and ready, but not built yet.</h2>
        <p>
          The route exists, the course context works, and the navigation is in
          place. The active editor/list UI will be built in a later pass.
        </p>
      </div>

      <div className="teaching-workspace-grid">
        {copy.futureTools.map((tool) => (
          <TeachingWorkspaceTile
            key={tool.title}
            title={tool.title}
            description={tool.description}
            meta={tool.meta}
            to={`/teaching/${course.id}`}
          />
        ))}
      </div>
    </section>
  );
}

export function ClassPrepPage() {
  return <TeachingToolPlaceholderPage toolKind="class-prep" />;
}

export function ClassNotebookPage() {
  return <TeachingToolPlaceholderPage toolKind="notebook" />;
}

export function GradingPage() {
  return <TeachingToolPlaceholderPage toolKind="grading" />;
}

export function OfficeHoursPage() {
  return <TeachingToolPlaceholderPage toolKind="office-hours" />;
}

export function TaFollowUpPage() {
  return <TeachingToolPlaceholderPage toolKind="ta" />;
}

export function CourseNotesPage() {
  return <TeachingToolPlaceholderPage toolKind="notes" />;
}

export function CourseResourcesPage() {
  return <TeachingToolPlaceholderPage toolKind="resources" />;
}
