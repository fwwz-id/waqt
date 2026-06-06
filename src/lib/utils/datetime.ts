/**
 * Timezone-aware date helpers. We rely on the platform Intl API so we don't
 * need heavy tz databases bundled. All prayer Date objects are absolute
 * instants; only *display* and *which calendar day* depend on the timezone.
 */

export type DateParts = { year: number; month: number; day: number };

/** Resolve the effective timezone: the location's, else the device's. */
export function effectiveTimeZone(timeZone?: string): string {
  if (timeZone) return timeZone;
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/** Calendar Y/M/D (1-based month) at a given instant in a given timezone. */
export function partsInTimeZone(date: Date, timeZone: string): DateParts {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(date);
  const get = (t: string) =>
    Number(parts.find((p) => p.type === t)?.value ?? "0");
  return { year: get("year"), month: get("month"), day: get("day") };
}

/**
 * Build a JS Date that adhan-js will read (via local getters) as the given
 * calendar day. adhan only uses year/month/day, so this is timezone-safe even
 * if the device timezone differs from the location timezone.
 */
export function adhanDateFor(parts: DateParts): Date {
  return new Date(parts.year, parts.month - 1, parts.day, 12, 0, 0, 0);
}

export function nextDayParts(parts: DateParts): DateParts {
  const d = new Date(parts.year, parts.month - 1, parts.day);
  d.setDate(d.getDate() + 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

/** Format an instant as a short 24h time label in the given timezone. */
export function formatTime(
  date: Date,
  timeZone: string,
  locale = "id-ID",
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/** Long localized date, e.g. "Sabtu, 6 Juni 2026" / "Saturday, 6 June 2026". */
export function formatLongDate(
  date: Date,
  timeZone: string,
  locale = "id-ID",
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** "HH:MM:SS" clock label in the given timezone. */
export function formatClock(
  date: Date,
  timeZone: string,
  locale = "id-ID",
): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

const DURATION_WORDS = {
  id: { lessThanMinute: "kurang dari 1 menit", min: "menit", hr: "jam" },
  en: { lessThanMinute: "less than 1 minute", min: "min", hr: "hr" },
} as const;

/**
 * Human countdown like "1 jam 24 menit" / "1 hr 24 min". Non-negative; clamps
 * at zero.
 */
export function formatDuration(ms: number, lang: "id" | "en" = "id"): string {
  const w = DURATION_WORDS[lang];
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (totalMinutes <= 0) return w.lessThanMinute;
  if (hours === 0) return `${minutes} ${w.min}`;
  if (minutes === 0) return `${hours} ${w.hr}`;
  return `${hours} ${w.hr} ${minutes} ${w.min}`;
}

/** Compact countdown "01:24:30" or "24:30" for the hero timer. */
export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
