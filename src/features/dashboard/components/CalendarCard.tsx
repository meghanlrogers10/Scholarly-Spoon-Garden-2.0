import { useMemo, useState } from "react";
import { Card } from "../../../shared/ui/Card";
import { CalendarEventDetailModal } from "./CalendarEventDetailModal";
import type {
  CalendarItem,
  CalendarSource,
} from "../../../shared/types/calendar";
import type { TimerMood } from "../../../shared/types/timer";

type CalendarView = "day" | "week" | "month";

type CalendarCardProps = {
  items: CalendarItem[];
  dayStartHour?: number;
  dayEndHour?: number;
  showWeekends?: boolean;
  onDeleteCalendarItem?: (item: CalendarItem) => void;
  onEditCalendarTask?: (item: CalendarItem) => void;
  onRemovePlannedTask?: (item: CalendarItem) => void;
  onMarkCalendarTaskDone?: (item: CalendarItem) => void;
  onEditWorkingBlocks?: () => void;
};

const DEFAULT_DAY_START_HOUR = 9;
const DEFAULT_DAY_END_HOUR = 21;

function clampHour(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}


const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const weekdayLabelsWithoutWeekends = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const moodIconMap: Record<TimerMood, string> = {
  overwhelmed: "😫",
  meh: "😐",
  satisfied: "🙂",
  proud: "😄",
  energized: "🚀",
};

const sourceIconMap: Record<CalendarSource, string> = {
  timed: "⏱️",
  pomodoro: "🍅",
  manual: "✍️",
  task: "📌",
  "working-block": "🕰️",
  "planned-task": "🧩",
};

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getDateForOffset(dayOffset: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return addDays(date, dayOffset);
}

function getStartOfWeekOffset(offset: number) {
  const date = getDateForOffset(offset);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return offset + diff;
}

function getMonthGridOffsets(offset: number) {
  const date = getDateForOffset(offset);
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const today = getDateForOffset(0);

  const firstOffset = Math.round(
    (firstOfMonth.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
  );

  const gridStartOffset = getStartOfWeekOffset(firstOffset);

  return Array.from({ length: 42 }, (_, index) => gridStartOffset + index);
}

function isWeekendOffset(offset: number) {
  const day = getDateForOffset(offset).getDay();

  return day === 0 || day === 6;
}

function formatDisplayDate(dayOffset: number) {
  return getDateForOffset(dayOffset).toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatMonthTitle(dayOffset: number) {
  return getDateForOffset(dayOffset).toLocaleDateString([], {
    month: "long",
    year: "numeric",
  });
}

function formatHourLabel(hour: number) {
  const date = new Date();
  date.setHours(hour, 0, 0, 0);

  return date.toLocaleTimeString([], {
    hour: "numeric",
  });
}

function parseTimeToMinutes(time?: string) {
  if (!time) {
    return -1;
  }

  const normalized = time.trim().toUpperCase();
  const twelveHourMatch = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);

  if (twelveHourMatch) {
    let hours = Number(twelveHourMatch[1]);
    const minutes = Number(twelveHourMatch[2]);
    const meridiem = twelveHourMatch[3];

    if (meridiem === "PM" && hours !== 12) {
      hours += 12;
    }

    if (meridiem === "AM" && hours === 12) {
      hours = 0;
    }

    return hours * 60 + minutes;
  }

  const twentyFourHourMatch = normalized.match(/^(\d{1,2}):(\d{2})$/);

  if (twentyFourHourMatch) {
    const hours = Number(twentyFourHourMatch[1]);
    const minutes = Number(twentyFourHourMatch[2]);

    return hours * 60 + minutes;
  }

  return -1;
}

function getHourFromTime(time?: string) {
  return Math.floor(parseTimeToMinutes(time) / 60);
}

function sortByTime(items: CalendarItem[]) {
  return [...items].sort((a, b) => {
    if (a.isAllDay && !b.isAllDay) return -1;
    if (!a.isAllDay && b.isAllDay) return 1;

    return parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time);
  });
}

function getCategoryClass(category: CalendarItem["category"]) {
  switch (category) {
    case "Research":
      return "calendar-event research";
    case "Teaching":
      return "calendar-event teaching";
    case "Service":
      return "calendar-event service";
    case "MindSpace":
      return "calendar-event mindspace";
    case "Writing":
      return "calendar-event writing";
    case "Admin":
      return "calendar-event admin";
    default:
      return "calendar-event other";
  }
}

function getSourceLabel(source: CalendarSource) {
  if (source === "timed") return "Timed";
  if (source === "pomodoro") return "Focus bloom";
  if (source === "task") return "Task";
  if (source === "working-block") return "Available work time";
  if (source === "planned-task") return "Planned task";
  return "Manual";
}

function getEventMetaLabel(item: CalendarItem) {
  if (item.source === "planned-task") {
    const estimate = item.estimatedMinutes ? `${item.estimatedMinutes} min` : "planned";

    return item.endTime
      ? `${item.time}-${item.endTime} · ${estimate}`
      : estimate;
  }

  if (item.source === "working-block") {
    return item.endTime
      ? `${item.time}-${item.endTime} · ${item.workingBlockStatus ?? "planned"}`
      : item.workingBlockStatus ?? "planned";
  }

  if (item.source === "task") {
    return item.completed ? "Completed task" : "Due task";
  }

  return item.time || getSourceLabel(item.source);
}

function CalendarEventBlock({
  item,
  onSelect,
}: {
  item: CalendarItem;
  onSelect: (item: CalendarItem) => void;
}) {
  return (
  <button
  type="button"
    className={[
    getCategoryClass(item.category),
    item.source === "working-block" ? "working-block" : "",
    item.source === "planned-task" ? "planned-task" : "",
    item.workingBlockStatus ? `is-${item.workingBlockStatus}` : "",
    item.plannedTaskBlockStatus ? `is-${item.plannedTaskBlockStatus}` : "",
    item.completed ? "is-completed" : "",
  ].join(" ")}
  onClick={() => onSelect(item)}
>
    <div className="calendar-event-main">
        <span className="calendar-event-icons">
          <span
            title={getSourceLabel(item.source)}
            aria-label={getSourceLabel(item.source)}
          >
            {sourceIconMap[item.source]}
          </span>

          {item.completed && (
            <span title="Completed" aria-label="Completed">
              ✅
            </span>
          )}

          {item.mood && (
            <span title={item.mood} aria-label={`Mood: ${item.mood}`}>
              {moodIconMap[item.mood]}
            </span>
          )}
        </span>

        <strong>{item.title}</strong>
      </div>

      <small>{getEventMetaLabel(item)}</small>
    </button>
  );
}

export function CalendarCard({
  items,
  dayStartHour = DEFAULT_DAY_START_HOUR,
  dayEndHour = DEFAULT_DAY_END_HOUR,
  showWeekends = true,
  onDeleteCalendarItem,
  onEditCalendarTask,
  onRemovePlannedTask,
  onMarkCalendarTaskDone,
  onEditWorkingBlocks,
}: CalendarCardProps) {
  const [view, setView] = useState<CalendarView>("day");
  const visibleStartHour = clampHour(dayStartHour, 0, 22);
const visibleEndHour = clampHour(dayEndHour, visibleStartHour + 1, 23);

const hourBlocks = useMemo(
  () =>
    Array.from(
      { length: visibleEndHour - visibleStartHour + 1 },
      (_, index) => visibleStartHour + index,
    ),
  [visibleStartHour, visibleEndHour],
);
  const [currentOffset, setCurrentOffset] = useState(0);
const [selectedItem, setSelectedItem] = useState<CalendarItem | null>(null);

  const dayItems = useMemo(() => {
    return sortByTime(items.filter((item) => item.dayOffset === currentOffset));
  }, [items, currentOffset]);

  const allDayDayItems = dayItems.filter((item) => item.isAllDay);
  const timedDayItems = dayItems.filter((item) => !item.isAllDay);

  const inHoursDayItems = timedDayItems.filter((item) => {
    const hour = getHourFromTime(item.time);
	return hour >= visibleStartHour && hour <= visibleEndHour;
  });

  const outsideHoursDayItems = timedDayItems.filter((item) => {
    const hour = getHourFromTime(item.time);
	return hour < visibleStartHour || hour > visibleEndHour;
  });

  const weekStartOffset = getStartOfWeekOffset(currentOffset);
  const weekOffsets = Array.from(
    { length: 7 },
    (_, index) => weekStartOffset + index,
  ).filter((offset) => showWeekends || !isWeekendOffset(offset));

  const monthOffsets = getMonthGridOffsets(currentOffset).filter(
    (offset) => showWeekends || !isWeekendOffset(offset),
  );
  const visibleWeekdayLabels = showWeekends
    ? weekdayLabels
    : weekdayLabelsWithoutWeekends;
  const currentMonth = getDateForOffset(currentOffset).getMonth();

  function handlePrevious() {
    if (view === "day") {
      setCurrentOffset((value) => getAdjacentVisibleDayOffset(value, -1));
      return;
    }

    if (view === "week") {
      setCurrentOffset((value) => value - 7);
      return;
    }

    const currentDate = getDateForOffset(currentOffset);
    currentDate.setMonth(currentDate.getMonth() - 1);
    const today = getDateForOffset(0);

    setCurrentOffset(
      Math.round(
        (currentDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
      ),
    );
  }

  function handleNext() {
    if (view === "day") {
      setCurrentOffset((value) => getAdjacentVisibleDayOffset(value, 1));
      return;
    }

    if (view === "week") {
      setCurrentOffset((value) => value + 7);
      return;
    }

    const currentDate = getDateForOffset(currentOffset);
    currentDate.setMonth(currentDate.getMonth() + 1);
    const today = getDateForOffset(0);

    setCurrentOffset(
      Math.round(
        (currentDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000),
      ),
    );
  }

  function handleToday() {
    setCurrentOffset(showWeekends || !isWeekendOffset(0) ? 0 : weekStartOffset);
  }

  function getAdjacentVisibleDayOffset(offset: number, direction: 1 | -1) {
    let nextOffset = offset + direction;

    while (!showWeekends && isWeekendOffset(nextOffset)) {
      nextOffset += direction;
    }

    return nextOffset;
  }

  return (
    <Card className="calendar-card">
      <div className="card-heading-row">
        <div>
          <p className="eyebrow">🗓️ Calendar</p>
          <h2>Calendar</h2>
          <p className="muted-text">
            Day, week, and month view for academic work blocks.
          </p>
        </div>

        <div className="calendar-controls">
          <div className="calendar-view-toggle">
            <button
              className={view === "day" ? "active" : ""}
              onClick={() => setView("day")}
            >
              Day
            </button>
            <button
              className={view === "week" ? "active" : ""}
              onClick={() => setView("week")}
            >
              Week
            </button>
            <button
              className={view === "month" ? "active" : ""}
              onClick={() => setView("month")}
            >
              Month
            </button>
          </div>

          <div className="calendar-nav">
            <button onClick={handlePrevious}>←</button>
            <button onClick={handleToday}>Today</button>
            <button onClick={handleNext}>→</button>
          </div>
        </div>
      </div>

      {view === "day" && (
        <div className="calendar-day-view">
          <div className="calendar-day-header">
            <strong>{formatDisplayDate(currentOffset)}</strong>
            <span>{dayItems.length} items</span>
          </div>

          {allDayDayItems.length > 0 && (
            <div className="calendar-all-day-section">
              <div className="calendar-all-day-label">All day / due</div>
              <div className="calendar-all-day-items">
                {allDayDayItems.map((item) => (
                  <CalendarEventBlock
  key={item.id}
  item={item}
  onSelect={setSelectedItem}
/>
                ))}
              </div>
            </div>
          )}

          <div className="calendar-hour-grid">
            {hourBlocks.map((hour) => {
              const hourItems = inHoursDayItems.filter(
                (item) => getHourFromTime(item.time) === hour,
              );

              return (
                <div key={hour} className="calendar-hour-row">
                  <div className="calendar-hour-label">
                    {formatHourLabel(hour)}
                  </div>

                  <div className="calendar-hour-slot">
                    {hourItems.length === 0 ? (
                      <div className="calendar-empty-hour" />
                    ) : (
                      hourItems.map((item) => (
                        <CalendarEventBlock
  key={item.id}
  item={item}
  onSelect={setSelectedItem}
/>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {outsideHoursDayItems.length > 0 && (
            <div className="outside-hours-section">
              <h3>Outside visible hours</h3>
              <p className="muted-text">
                These are outside your visible calendar hours.
              </p>

              <div className="outside-hours-list">
                {outsideHoursDayItems.map((item) => (
                  <CalendarEventBlock
  key={item.id}
  item={item}
  onSelect={setSelectedItem}
/>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {view === "week" && (
        <div className="calendar-week-view">
          <div className="calendar-day-header">
            <strong>Week of {formatDisplayDate(weekStartOffset)}</strong>
            <span>Monday start</span>
          </div>

          <div
            className={[
              "calendar-week-grid",
              showWeekends ? "" : "calendar-week-grid--weekdays",
            ].join(" ")}
          >
            {weekOffsets.map((offset) => {
              const date = getDateForOffset(offset);
              const dayEvents = sortByTime(
                items.filter((item) => item.dayOffset === offset),
              );

              return (
                <div
                  key={offset}
                  className={`calendar-week-column ${
                    offset === 0 ? "is-today" : ""
                  }`}
                >
                  <div className="calendar-week-column-header">
                    <strong>
                      {date.toLocaleDateString([], { weekday: "short" })}
                    </strong>
                    <span>{date.getDate()}</span>
                  </div>

                  <div className="calendar-week-column-events">
                    {dayEvents.length === 0 ? (
                      <p className="calendar-empty-day">No events</p>
                    ) : (
                      dayEvents.map((item) => (
                        <CalendarEventBlock
  key={item.id}
  item={item}
  onSelect={setSelectedItem}
/>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "month" && (
        <div className="calendar-month-view">
          <div className="calendar-day-header">
            <strong>{formatMonthTitle(currentOffset)}</strong>
            <span>Month view</span>
          </div>

          <div
            className={[
              "calendar-month-labels",
              showWeekends ? "" : "calendar-month-labels--weekdays",
            ].join(" ")}
          >
            {visibleWeekdayLabels.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <div
            className={[
              "calendar-month-grid",
              showWeekends ? "" : "calendar-month-grid--weekdays",
            ].join(" ")}
          >
            {monthOffsets.map((offset) => {
              const date = getDateForOffset(offset);
              const dayEvents = sortByTime(
                items.filter((item) => item.dayOffset === offset),
              );

              const isCurrentMonth = date.getMonth() === currentMonth;

              return (
                <div
                  key={offset}
                  className={[
                    "calendar-month-cell",
                    offset === 0 ? "is-today" : "",
                    !isCurrentMonth ? "is-outside-month" : "",
                  ].join(" ")}
                >
<div className="calendar-month-cell-number">
  {date.getDate()}
</div>

<div className="calendar-month-cell-events">
  {dayEvents.slice(0, 3).map((item) => (
    <button
      type="button"
      key={item.id}
      className={[
        "calendar-month-event",
        item.category.toLowerCase(),
        item.completed ? "is-completed" : "",
        item.source === "working-block" ? "working-block" : "",
        item.source === "planned-task" ? "planned-task" : "",
        item.workingBlockStatus ? `is-${item.workingBlockStatus}` : "",
        item.plannedTaskBlockStatus ? `is-${item.plannedTaskBlockStatus}` : "",
      ].join(" ")}
      onClick={() => setSelectedItem(item)}
    >
      <span>{sourceIconMap[item.source]}</span>
      {item.completed && <span>✅</span>}
      {item.mood && <span>{moodIconMap[item.mood]}</span>}
      <strong>{item.title}</strong>
    </button>
  ))}

  {dayEvents.length > 3 && (
    <small>+{dayEvents.length - 3} more</small>
  )}
</div>
                  </div>
              );
            })}
          </div>
        </div>
      )}
<CalendarEventDetailModal
  item={selectedItem}
  onClose={() => setSelectedItem(null)}
  onDeleteItem={
    onDeleteCalendarItem
      ? (item) => {
          onDeleteCalendarItem(item);
          setSelectedItem(null);
        }
      : undefined
  }
  onEditTask={
    onEditCalendarTask
      ? (item) => {
          onEditCalendarTask(item);
          setSelectedItem(null);
        }
      : undefined
  }
  onRemovePlannedTask={
    onRemovePlannedTask
      ? (item) => {
          onRemovePlannedTask(item);
          setSelectedItem(null);
        }
      : undefined
  }
  onMarkTaskDone={
    onMarkCalendarTaskDone
      ? (item) => {
          onMarkCalendarTaskDone(item);
          setSelectedItem(null);
        }
      : undefined
  }
  onEditWorkingBlocks={
    onEditWorkingBlocks
      ? () => {
          onEditWorkingBlocks();
          setSelectedItem(null);
        }
      : undefined
  }
/>
    </Card>
  );
}
