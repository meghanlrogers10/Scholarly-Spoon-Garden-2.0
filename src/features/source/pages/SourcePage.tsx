import { Link } from "react-router-dom";
import { Card } from "../../../shared/ui/Card";
import { PageHeader } from "../../../shared/ui/PageHeader";

const finishedItems = [
  "React + TypeScript + Vite foundation",
  "Global app shell and navigation",
  "Dashboard command center",
  "Tasks page with filters and Today toggle",
  "Floating timer and Timer Log foundation",
  "Research local MVP with projects, literature, notes, drafts, submissions, PRISMA, imports, DOI lookup, and exports",
  "Teaching local MVP with courses, prep, grading, TA follow-up, office hours, announcements, notes, and resources",
  "Service local MVP with load snapshot, triage, inbox, buckets, committees, and advising",
  "Mindspace route and shell",
  "Settings route with calendar-hour controls",
];

const almostFinishedItems = [
  "Dashboard v1 as an organizer",
  "Timer v1 as a working timer",
  "Research v1 local workflow",
  "Teaching v1 local workflow",
  "Service v1 containment workflow",
];

const weakSpots = [
  "Shared task bridge is still too research-centered",
  "Task model is not rich enough for time reality yet",
  "Mindspace is still mostly a shell",
  "Settings is too small and needs to become Options",
  "Timer Log is still a history page, not a Time Reality Center",
  "No Daily Check-In yet",
  "No Working Blocks yet",
  "No Today Builder yet",
  "No Firestore/Auth/Netlify production setup yet",
];

const nextSprints = [
  "Stabilize build and lint",
  "Shared Task Bridge v2",
  "Task model upgrade",
  "Daily Check-In",
  "Working Blocks",
  "Today Builder",
  "Planned vs Actual Calendar",
  "Timer Stop Feedback",
  "Timer Log Time Reality Center",
  "End-of-Day Review",
  "Mindspace V1",
  "Options V1",
  "Service V2",
  "Teaching templates and Add-to-Today polish",
  "Research polish",
  "Firestore/Auth",
  "Netlify deployment",
  "Calendar, Docs, Zotero, and mobile/PWA integrations",
];

const productPrinciples = [
  "Do not help the user make fantasy plans.",
  "Protect the difference between available time, planned work, actual work, and completed work.",
  "Make postponement a legitimate planning action, not a failure.",
  "Keep Research, Teaching, and Service distinct, but let them feed the same daily planning system.",
  "Use the timer to teach the app how long academic work really takes.",
  "Build for low-energy days, not just ideal days.",
  "Do not become Notion, Zotero, Todoist, or Sunsama. Borrow useful patterns, but stay academic and spoon-aware.",
];

const restartChecklist = [
  "Open this Source page first.",
  "Check the next sprint list.",
  "Run npm run dev.",
  "Run npx tsc -b --pretty false before major changes.",
  "Make one change at a time.",
  "Do not start Firestore until the shared task model and planning spine are stable.",
  "Do not add a new major feature until the current sprint is committed.",
];

export function SourcePage() {
  return (
    <section className="page-stack">
      <PageHeader
        eyebrow="Source / Project Memory"
        title="Scholarly Spoon Garden 2.0 build map"
        description="The restart page for the app: what is done, what is risky, what comes next, and what the product is trying to become."
      />

      <Card>
        <p className="eyebrow">Product north star</p>
        <h2>Reality-based planning for ADHD academics.</h2>
        <p>
          SSG should tell the user what can realistically fit today across
          research, teaching, service, energy, deadlines, and actual time
          history. It should not become a generic task app.
        </p>
      </Card>

      <div className="card-grid">
        <Card>
          <p className="eyebrow">Finished / mostly finished</p>
          <h2>What is already real</h2>
          <ul>
            {finishedItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>

        <Card>
          <p className="eyebrow">Almost finished</p>
          <h2>Good local MVP areas</h2>
          <ul>
            {almostFinishedItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>

        <Card>
          <p className="eyebrow">Risk list</p>
          <h2>What can bite us</h2>
          <ul>
            {weakSpots.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <p className="eyebrow">Next build queue</p>
        <h2>Do these in order</h2>
        <ol>
          {nextSprints.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </Card>

      <div className="card-grid">
        <Card>
          <p className="eyebrow">Core principles</p>
          <h2>Do not lose the plot</h2>
          <ul>
            {productPrinciples.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>

        <Card>
          <p className="eyebrow">Restart checklist</p>
          <h2>After a break</h2>
          <ul>
            {restartChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>

        <Card>
          <p className="eyebrow">Fast links</p>
          <h2>Jump back into the app</h2>
          <ul>
            <li>
              <Link to="/dashboard">Dashboard</Link>
            </li>
            <li>
              <Link to="/tasks">Tasks</Link>
            </li>
            <li>
              <Link to="/timer-log">Timer Log</Link>
            </li>
            <li>
              <Link to="/mindspace">Mindspace</Link>
            </li>
            <li>
              <Link to="/settings">Settings</Link>
            </li>
          </ul>
        </Card>
      </div>
    </section>
  );
}