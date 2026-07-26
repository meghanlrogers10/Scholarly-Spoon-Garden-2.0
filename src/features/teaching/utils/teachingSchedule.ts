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

export type MeetingTimeRange = {
  startTime: string;
  endTime: string;
};

function parseClock(value: string, meridiemHint?: string) {
  const normalized = value.trim().toLowerCase().replace(/\./g, "");
  const match = normalized.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);

  if (!match) {
    return undefined;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2] ?? "0");
  const meridiem = match[3] ?? meridiemHint;

  if (minutes > 59) {
    return undefined;
  }

  if (meridiem) {
    if (hours < 1 || hours > 12) {
      return undefined;
    }

    if (meridiem === "pm" && hours < 12) hours += 12;
    if (meridiem === "am" && hours === 12) hours = 0;
  } else if (hours > 23) {
    return undefined;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function parseMeetingTimeRange(pattern?: string): MeetingTimeRange | undefined {
  if (!pattern?.trim()) {
    return undefined;
  }

  const match = pattern.match(
    /(\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?)\s*(?:-|\u2013|\u2014|\bto\b)\s*(\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?)/i,
  );

  if (!match) {
    return undefined;
  }

  const startMeridiem = match[1].match(/(am|pm)\.?$/i)?.[1];
  const startTime = parseClock(match[1], startMeridiem);
  const endTime = parseClock(match[2], startMeridiem);

  if (!startTime || !endTime) {
    return undefined;
  }

  return { startTime, endTime };
}

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
