# Design System

Scholarly Spoon Garden 2 should feel calm, warm, academic, spoon-aware, Pride-infused, and alive.

It should not feel like a corporate productivity app, a sterile SaaS dashboard, a hospital portal, an LMS clone, or a spreadsheet with pastel paint.

The design should make the user want to open the app even when they are tired.

---

## Design Goal

The visual system should reduce resistance.

The app should feel like:

- an academic garden
- a gentle command center
- a soft place to organize serious work
- a system that understands uneven energy
- a Pride-infused workspace built for an overwhelmed but capable academic

The app should not feel childish, but it can be slightly whimsical.

The tone is:

- warm
- practical
- calm
- direct
- affirming
- encouraging without being cheesy

---

## Visual Identity

Core visual language:

- soft cream backgrounds
- lavender and purple structure
- Pride-inspired rainbow accents
- warm coral teaching accents
- green service/garden accents
- research purple/blue accents
- rounded cards
- gentle shadows
- spacious layouts
- readable text
- emoji or icon accents used sparingly
- dashboard cards that feel like containers, not boxes

The app should look organized but not rigid.

It should feel queer-friendly, academic, colorful, and alive without becoming visually chaotic.

---

## Pride Theme

Scholarly Spoon Garden embraces a Pride-inspired visual identity.

This does not mean every page should look like a parade float. It means the app should feel colorful, alive, affirming, and intentionally non-corporate.

The Pride theme should show up through:

- rainbow accents
- warm gradients
- colorful task/category systems
- gentle use of Pride-inspired colors
- playful but tasteful visual moments
- inclusive language
- refusal of sterile productivity culture

The app should feel like it was built by and for a real person, not a venture-backed productivity company.

---

## Rainbow Use

Rainbow should be part of the app’s visual DNA.

Use rainbow color intentionally for:

- calendar task categories
- energy/spoon visuals
- progress accents
- section dividers
- celebratory completed states
- dashboard highlights
- gentle hover/focus states
- timer accents
- status dots
- category strips

Avoid using rainbow everywhere at once.

Rainbow should guide and energize the interface, not overwhelm it.

Good rainbow use:

- category color strip on task cards
- ROYGBIV calendar blocks
- subtle rainbow border on the active timer
- Pride-inspired gradient on dashboard hero
- colorful spoon tracker
- rainbow accent dots on navigation or status items
- small rainbow progress bars
- colored chips for different work areas

Bad rainbow use:

- every card using every color
- full saturated rainbow backgrounds behind text
- unreadable gradients
- making serious work pages look chaotic
- using rainbow only as decoration without function
- making the app look like clip art

---

## Pride Without Cheesiness

The Pride theme should feel grown-up, academic, and warm.

It should not feel like clip art.

The visual tone is:

- affirming
- colorful
- clever
- soft
- intentional
- a little defiant
- not sanitized

The app can be whimsical, but it should still feel capable.

Use Pride elements as part of the structure, not just as stickers.

---

## Pride and Accessibility

Pride colors still need to be readable.

Do not use low-contrast rainbow text.

Do not rely on color alone to communicate status.

Pair colors with:

- labels
- icons
- badges
- text
- position
- patterns when useful

The rainbow should be beautiful and usable.

---

## Color Principles

Colors should signal area, energy, and emotional weight.

The palette should combine:

- soft academic neutrals
- lavender/purple structure
- Pride-inspired rainbow accents
- warm category colors
- gentle status colors

Color should make the app easier to understand, not harder.

---

## Core Backgrounds

Use soft, warm backgrounds rather than bright white.

Suggested values:

```css
--color-bg: #f7f2eb;
--color-surface: #fffaf5;
--color-surface-strong: #ffffff;
```

---

## Core Purples

Purple is the app’s structural color.

Use for:

- navigation
- main headings
- primary buttons
- active states
- important labels
- calm structure

Suggested values:

```css
--color-lavender: #e8ddf5;
--color-lavender-strong: #c8a7ee;
--color-purple: #6f4f9c;
--color-deep-purple: #4d3575;
```

---

## Area Colors

Each major life area should have a recognizable accent.

Suggested values:

```css
--color-research: #6f4fe4;
--color-teaching: #ff8f70;
--color-service: #77c7a0;
--color-dashboard: #c8a7ee;
--color-mindspace: #b8ddf2;
```

Use these as accents, not full-page saturation.

Area colors should help the user instantly know where they are.

---

## Mood and Energy Colors

Energy and status colors should be informative, not alarming.

Avoid aggressive red unless something is truly urgent.

Suggested pattern:

- low energy: muted blue/lavender
- steady energy: green/mint
- high energy: warm gold/coral
- overdue/urgent: restrained red/pink
- completed: soft green or faded neutral
- waiting: muted purple or blue
- postponed: soft gray/lavender

Color should help the user decide what matters without making the page feel like an emergency.

---

## Typography

Typography should be readable and calm.

Use system sans-serif fonts unless there is a strong reason not to.

Preferred stack:

```css
font-family:
  Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
  sans-serif;
```

---

## Headings

Headings should be clear, not overly decorative.

Use headings for hierarchy, not drama.

Large page headers can be expressive, but tool pages should prioritize readability.

Good heading style:

- clear
- warm
- confident
- not too tiny
- not overly formal

---

## Body Text

Body text should be plainspoken.

Avoid tiny text in dense sections.

If a page needs a table, the table should still breathe.

Helpful body text should explain what the user can do next.

Avoid generic filler text.

Bad:

> Manage your items here.

Better:

> Track grading items, missing submissions, and what needs to be returned next.

---

## Layout Principles

### 1. Overview pages triage

Overview pages should help the user choose what matters.

They should favor:

- summary cards
- needs attention panels
- low-spoon options
- due soon lists
- recently touched items
- quick actions

They should avoid:

- giant tables
- every record at once
- dense form-heavy layouts
- walls of equal-priority items

---

### 2. Detail pages store

Subpages can hold more detail.

Examples:

- Research overview shows project status.
- Literature page stores sources and notes.
- Teaching overview shows what needs attention.
- Grading page stores grading records.
- Service overview shows urgent obligations.
- Committee page stores committee notes/tasks.

---

### 3. Cards should group meaningfully

Cards should not be decoration.

Each card should answer one question or support one action.

Good cards:

- Needs Attention
- Low-Spoon Mode
- Upcoming Deadlines
- Active Courses
- Current Drafts
- Waiting on Someone Else
- Recently Touched
- Quick Wins

Bad cards:

- Random stats with no action
- Dense lists with no prioritization
- Duplicated information from another page
- Counts that do not help the user decide what to do

---

## Cards

Cards are the main visual container.

Card style:

```css
border-radius: 20px to 28px;
background: rgba(255, 250, 245, 0.88);
border: 1px solid rgba(219, 205, 191, 0.8);
box-shadow: gentle, warm, low contrast;
```

Cards should have:

- clear title
- short description or status
- one main action when possible
- secondary actions grouped quietly
- enough padding to feel calm

Cards should not have:

- too many buttons
- too many badges
- tiny crowded text
- nested card chaos
- equal visual weight for everything

---

## Buttons

Buttons should make action obvious.

### Primary Button

Use for the main action on a page or card.

Examples:

- Add Course
- Add Project
- Start Timer
- Add to Today
- Create Task
- Add Source
- Add Grading Item

Primary buttons should usually use deep purple.

### Secondary Button

Use for actions that are useful but not dominant.

Examples:

- Edit
- View Details
- Export
- Archive
- Restore
- Add Note

### Destructive Button

Use sparingly.

Examples:

- Delete
- Permanently Delete

Destructive actions should require confirmation.

Avoid making destructive buttons visually louder than primary work actions.

---

## Badges

Badges should communicate status quickly.

Use badges for:

- priority
- status
- area
- spoon cost
- due soon
- overdue
- waiting
- completed
- archived
- low-spoon
- high-effort

Badges should be short.

Good:

- High
- Due soon
- Waiting
- Low spoon
- Done
- Drafting
- Overdue
- Stuck

Bad:

- This item is very important and should be handled soon

---

## Empty States

Empty states matter.

They should reduce shame and tell the user what to do next.

Good empty state:

> Nothing is screaming right now. Add grading, TA, office-hour, and prep items as your teaching workflow grows.

Bad empty state:

> No data found.

Empty states should be:

- calm
- specific
- useful
- non-judgmental
- lightly encouraging

They can include one clear action.

---

## ADHD-Friendly UI Rules

### 1. Reduce choices on overview pages

Do not show everything at once.

Show the most important things first.

The user should not have to scan a giant backlog to figure out what matters.

---

### 2. Make next actions visible

Whenever possible, show the next concrete action.

Example:

Instead of:

> CRIM 1447 Essay 1

Show:

> Grade CRIM 1447 Essay 1  
> Next action: Open rubric and grade first 5 submissions.

A next action should make starting easier.

---

### 3. Support low-spoon use

Low-spoon sections should show only a few items.

No giant backlog.

No guilt language.

No “you are behind” framing.

Low-spoon mode should answer:

- What is the smallest viable move?
- What absolutely cannot wait?
- What can be postponed?
- What would reduce the most pressure?

---

### 4. Use progressive disclosure

Show summaries first.

Let the user open details when needed.

Avoid making the user face every field, record, and option immediately.

---

### 5. Preserve context

When the user enters a project, course, committee, or timer session, the page should clearly show where they are.

Examples:

- CRIM 1447 · Spring 2026
- SCD Paper · Literature
- Undergraduate Committee · Notes
- Dashboard · Today’s Plan

The user should never feel lost inside the app.

---

### 6. Avoid surprise navigation

Buttons should do what they say.

Modals should not trap the user.

Delete/archive actions should be clear.

The app should feel predictable.

---

## Page Patterns

### Dashboard

The Dashboard is the daily operating system.

It should show:

- energy/spoons
- today’s plan
- calendar/work blocks
- working sessions
- quick capture
- due soon
- low-spoon options
- what can wait

It should not become a full task database.

The Dashboard should help the user start the day realistically.

---

### Research

Research should feel like a manuscript garden.

It should show:

- projects
- stages
- literature
- notes
- drafts
- research log
- submissions
- where the user left off
- next writing/research move

Research pages can be denser than Dashboard, but they still need hierarchy.

Research should support deep work without becoming visually punishing.

---

### Teaching

Teaching should feel like a semester command center.

It should show:

- active courses
- needs attention
- low-spoon teaching actions
- grading pressure
- TA follow-ups
- office-hour follow-ups
- upcoming class prep
- next class meetings
- course notes and changes for next time

Teaching should not become an LMS clone.

Teaching should answer:

- What needs my attention?
- What can wait?
- What is the next tiny action?
- What do I need before the next class?

---

### Service

Service should make invisible obligations visible.

It should show:

- committees
- advising
- reviews/letters/admin
- urgent service tasks
- waiting items
- things that can be postponed or delegated
- what is quietly becoming a problem

Service should not become a miscellaneous junk drawer.

Service should help the user protect time and energy.

---

### Timer

Timer should feel immediate and lightweight.

It should:

- be easy to start
- be easy to stop
- capture what happened
- allow reflection without friction
- connect work back to calendar and tasks
- support real work patterns, not fantasy ones

Timer should not require a full form before beginning.

Starting the timer should be low-friction.

Stopping the timer should help capture reality.

---

## Forms

Forms should be short by default.

Only require what is necessary.

Good required fields:

- title/name
- course/project if context is not already known
- due date only when the record truly needs one

Avoid requiring:

- notes
- description
- tags
- dates
- categories
- long explanations

Optional fields are useful, but they should not make the form feel heavy.

For complex records, allow saving a rough version first and refining later.

The user should be able to capture messy information quickly.

---

## Tables

Tables are allowed, but they should not dominate the app.

Use tables when the data is naturally tabular:

- class notebook rows
- grading tracker
- office-hour log
- resources
- submissions
- literature/source lists

Tables should include:

- readable spacing
- clear actions
- empty states
- sorting/filtering only when useful
- responsive behavior for smaller screens

Avoid spreadsheet energy unless the user explicitly needs a spreadsheet-like tool.

---

## Modals

Use modals for focused actions:

- add/edit course
- add/edit task
- add/edit grading item
- stop timer reflection
- generate class schedule
- add/edit semester
- add/edit project

Avoid deeply nested modals.

Avoid modals for long writing sessions if a page would be better.

A modal should support a quick decision or a contained edit, not become a full workspace.

---

## Icons and Emoji

Icons and emoji can help the app feel friendly.

Use them sparingly.

Good uses:

- section identity
- navigation
- status hints
- timer mode
- mood/energy
- low-spoon markers
- completed work

Avoid emoji overload.

The app should feel warm, not goofy.

---

## Language and Tone

The app should speak plainly.

Tone should be:

- direct
- kind
- grounded
- non-shaming
- lightly encouraging
- practical

Good:

- “What needs attention?”
- “Low-spoon options”
- “Nothing is screaming right now.”
- “Add to Today”
- “Where I left off”
- “Next tiny action”
- “Can wait”
- “Waiting on someone else”
- “Done enough for today”

Avoid:

- “Crush your goals”
- “Maximize productivity”
- “You are behind”
- “No excuses”
- “Failure”
- “Incomplete obligations”
- “Productivity score”

This is not hustle software.

---

## Visual Consistency Rules for Codex

When adding new features, preserve:

- existing color tokens
- rounded cards
- gentle shadows
- warm backgrounds
- calm spacing
- readable forms
- feature-specific accent colors
- Pride-inspired rainbow accents
- existing navigation style
- useful empty states

Codex should not:

- introduce a new visual framework
- add Bootstrap/Tailwind/component libraries without approval
- make one feature visually look like a different app
- replace global styles casually
- create dense, generic admin dashboards
- overuse tables
- remove empty states
- change the color palette without approval
- flatten the app into generic SaaS blue/gray
- remove rainbow category logic
- replace warm colors with sterile neutrals
- make the app visually closeted or corporate
- use Pride colors in ways that hurt readability

---

## Component Guidance

Prefer small components.

A component over 250 lines should be questioned.

A component over 400 lines should usually be split.

Good splits:

- Page
- Header
- SummaryStrip
- Card
- Table
- Row
- Modal
- EmptyState
- Subnav
- Toolbar
- FilterPanel

Avoid one giant page file that handles everything.

Feature pages should coordinate components. They should not contain every row, form, helper, and export function inline.

---

## Responsive Design

The app should be usable on smaller screens, but desktop is the primary academic work mode.

Responsive rules:

- cards stack on narrow screens
- nav remains usable
- tables can scroll horizontally if needed
- forms should not overflow
- primary actions remain visible
- important context should not disappear

Do not sacrifice desktop clarity for mobile perfection.

---

## Accessibility Basics

At minimum:

- buttons should be real buttons
- inputs should have labels
- focus states should remain visible
- color should not be the only status signal
- text contrast should be readable
- destructive actions should be clear
- links should be recognizable
- interactive elements should have accessible names

Accessibility should be treated as part of calm design.

A beautiful page that is hard to read or navigate is not successful.

---

## Design Decision Test

Before accepting a design change, ask:

1. Does this reduce cognitive load?
2. Does this make the next action clearer?
3. Does this preserve the app’s warm academic feel?
4. Does this preserve the Pride-infused identity?
5. Does this avoid shame/guilt language?
6. Does this belong on an overview page or detail page?
7. Would I want to open this when tired?
8. Did we make the app more useful, or just bigger?
9. Is the rainbow helping function or just adding noise?
10. Does this still feel like Scholarly Spoon Garden?

---

## North Star

The app should feel like a soft but capable Pride-infused academic command center.

The user should open it and think:

“I know what matters. I know what fits. I can start.”