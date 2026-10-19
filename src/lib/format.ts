// format.ts — turns raw config values into the text visitors see, with "TBA" as the fallback.
//
// I centralize this so every section handles unconfirmed info the same way. If a value is null, these
// helpers return "TBA" — components never have to remember to check.

export const TBA = "TBA";

// Dublin, CA is on Pacific time. I always format in this zone (not the visitor's), because the event happens
// in Dublin no matter where someone is reading from.
const EVENT_TZ = "America/Los_Angeles";

const dayFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: EVENT_TZ,
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

const timeFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: EVENT_TZ,
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short", // adds "PST"/"PDT" so nobody has to guess
});

// Returns a Date, or null if the string is missing or not a real date (so a typo shows "TBA" instead of
// "Invalid Date" on the live site).
export function parseDate(iso: string | null): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

// "Saturday, March 14, 2026" or "TBA".
export function formatDay(iso: string | null): string {
  const d = parseDate(iso);
  return d ? dayFmt.format(d) : TBA;
}

// "8:00 AM – 8:00 PM PDT", just the start time if there's no end, or null if there's no start.
// Returns null (not "TBA") so the caller can decide to hide the time line entirely.
export function formatTimeRange(startIso: string | null, endIso: string | null): string | null {
  const start = parseDate(startIso);
  if (!start) return null;
  const end = parseDate(endIso);
  if (!end) return timeFmt.format(start);
  // Drop the zone from the start time so it only appears once: "8:00 AM – 8:00 PM PDT".
  const startNoZone = timeFmt.formatToParts(start).filter((p) => p.type !== "timeZoneName").map((p) => p.value).join("").trim();
  return `${startNoZone} – ${timeFmt.format(end)}`;
}

// "Jane Doe" => "JD". Used for team members without a photo.
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}
