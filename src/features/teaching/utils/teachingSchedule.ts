const weekdayAliases: Array<[number, string[]]> = [
  [1, ["monday", "mon"]],
  [2, ["tuesday", "tue", "tues", "tu"]],
  [3, ["wednesday", "wed"]],
  [4, ["thursday", "thu", "thur", "thurs", "th"]],
  [5, ["friday", "fri"]],
];

const weekdayCodes: Array<[string, number[]]> = [
  ["mtwthf", [1, 2, 3, 4, 5]],
  ["mtw", [1, 2, 3]],
  ["tth", [2, 4]],
  ["tr", [2, 4]],
  ["mwf", [1, 3, 5]],
  ["mw", [1, 3]],
  ["mf", [1, 5]],
  ["wf", [3, 5]],
  ["mth", [1, 4]],
  ["tuf", [2, 5]],
];

export function inferWeekdaysFromMeetingPattern(pattern?: string) {
  if (!pattern?.trim()) {
    return [];
  }

  const dayText = pattern.toLowerCase().split(/\d/)[0];
  const compact = dayText.replace(/[^a-z]/g, "");
  const weekdays = new Set<number>();

  weekdayAliases.forEach(([weekday, aliases]) => {
    if (aliases.some((alias) => compact.includes(alias))) {
      weekdays.add(weekday);
    }
  });

  weekdayCodes.forEach(([code, values]) => {
    if (compact.includes(code)) {
      values.forEach((weekday) => weekdays.add(weekday));
    }
  });

  if (compact === "m") weekdays.add(1);
  if (compact === "t") weekdays.add(2);
  if (compact === "w") weekdays.add(3);
  if (compact === "r") weekdays.add(4);
  if (compact === "f") weekdays.add(5);

  return Array.from(weekdays).sort((a, b) => a - b);
}
