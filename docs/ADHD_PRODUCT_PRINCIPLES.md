# ADHD Product Principles

Scholarly Spoon Garden is not just a task tracker.

It is an ADHD-friendly academic command center designed to help an overwhelmed academic answer four questions:

1. What actually needs my attention?
2. What can realistically fit into the time and energy I have?
3. What can wait without becoming a crisis?
4. What did I actually do?

The app should reduce cognitive load, externalize memory, and make academic work more visible without turning into a guilt archive.

---

## Core Philosophy

The app should track reality, not shame.

It should help the user make better decisions under uneven energy, limited time, emotional overload, and executive dysfunction.

The goal is not maximum productivity.

The goal is sustainable academic functioning.

---

## Product Rules

### 1. Main pages triage. Subpages store.

Dashboard, Research, Teaching, and Service overview pages should not become giant databases.

Their job is to answer:

- What needs attention?
- What is due soon?
- What is stuck?
- What is the next reasonable action?

Detailed records belong inside subpages.

Example:

- Teaching overview should show “Essay 1 grading is due soon.”
- Grading page should store all grading details.

---

### 2. No vague tasks.

A task like “work on teaching” is not useful.

Tasks should be concrete enough that the user knows how to start.

Bad:

- Work on class
- Do research
- Prep lecture
- Service stuff

Better:

- Upload CRIM 1447 rubric to ICON
- Revise first two slides for Tuesday lecture
- Code homicide model with LAC interaction
- Email TA about discussion grading
- Draft three bullet points for committee report

---

### 3. Every important item should have a next action.

Projects, courses, grading items, TA follow-ups, office-hour visits, and service obligations should all support a “next action” when possible.

A next action is the smallest visible move that reduces uncertainty.

Examples:

- “Email student about extension.”
- “Find last semester’s rubric.”
- “Open do-file and rerun Model 3.”
- “Ask TA what discussion posts are still missing.”
- “Move this reading to Week 4 next semester.”

---

### 4. Time and spoons both matter.

The app should not assume all open hours are equal.

A two-hour block with low energy is not the same as a two-hour block with high energy.

Planning should consider:

- available time
- available spoons
- task size
- emotional load
- deadline pressure
- recovery needs

The app should help the user decide what fits the day, not just what is due.

---

### 5. The app should make invisible academic labor visible.

Academic work often disappears until it becomes urgent.

The app should surface hidden labor, including:

- grading queues
- student follow-ups
- TA management
- office-hour issues
- committee tasks
- manuscript next steps
- revise-and-resubmit details
- service obligations
- emotional/admin residue from meetings

The app should catch these before they become “oh shit” tasks.

---

### 6. Low-spoon mode is a first-class workflow.

The app should support days when the user has limited energy.

Low-spoon mode should answer:

- What absolutely must happen today?
- What can be postponed?
- What is the smallest viable version?
- What task would reduce the most pressure?
- What can be done in five minutes?

Low-spoon mode should not shame the user or show a giant backlog.

It should narrow the field.

---

### 7. Postponing is a legitimate planning action.

The app should normalize moving tasks.

A postponed task should not feel like a failure.

When something is postponed, the app should help capture:

- why it moved
- when it should resurface
- whether it still matters
- whether it can be reduced, delegated, or deleted

The goal is honest planning, not fantasy planning.

---

### 8. Capture should be fast and messy.

The user should be able to dump thoughts quickly without deciding where everything belongs immediately.

Quick capture should support:

- random ideas
- student follow-ups
- research thoughts
- teaching changes
- service reminders
- emotional residue
- “remember this later” notes

The app can help sort later.

Capture first. Organize second.

---

### 9. The app should support recovery, not just output.

Burnout recovery requires pacing.

The app should help the user see:

- how much work was actually done
- how much effort tasks consumed
- what kinds of work drained energy
- what kinds of work were sustainable
- whether the day’s plan was realistic

The timer, calendar, and completed work logs should show reality gently.

---

### 10. Overview pages should reduce decisions.

ADHD users often struggle less with knowing what exists and more with choosing what to do next.

The app should not simply present a large list.

It should prioritize.

Good overview sections:

- Needs attention
- Due soon
- Waiting on someone else
- Low-spoon options
- Recently touched
- Stale or stuck
- Quick wins

Bad overview sections:

- Every item ever
- Giant unsorted lists
- Dense tables with no guidance
- Counts without action

---

### 11. Design should feel calm, academic, and alive.

Scholarly Spoon Garden should feel:

- soft
- colorful
- academic
- warm
- spoon-aware
- slightly whimsical
- organized but not sterile

It should not feel like:

- corporate productivity software
- a hospital portal
- a punishment dashboard
- an LMS clone
- a spreadsheet with decorations

The visual design should lower resistance to opening the app.

---

### 12. Features should be built around real academic workflows.

The app should reflect the actual work of an academic, including:

- writing
- reading
- revising
- coding analyses
- teaching prep
- grading
- student support
- TA supervision
- committee work
- advising
- letters
- admin requests
- emotional recovery after institutional nonsense

The app should not pretend academic work is clean or linear.

---

## Feature Design Checklist

Before adding a feature, ask:

1. Does this reduce cognitive load?
2. Does this make hidden work visible?
3. Does this help the user choose a next action?
4. Does this support low-energy use?
5. Does this avoid becoming a guilt archive?
6. Does this belong on an overview page or a detail page?
7. Does this preserve the Scholarly Spoon Garden feel?
8. Can it work locally before Firestore?
9. Can it be built in small, recoverable steps?
10. Would future-me understand why this exists?

---

## Things the App Should Avoid

The app should avoid:

- giant forms
- unnecessary required fields
- vague task names
- cluttered dashboards
- too many modals
- productivity shame language
- overbuilt features before core workflows work
- Firebase complexity before local behavior is stable
- duplicating task systems across features
- turning every academic process into a spreadsheet

---

## The North Star

Scholarly Spoon Garden should help the user open the app and think:

“I know what matters. I know what fits. I know what can wait. I can start.”