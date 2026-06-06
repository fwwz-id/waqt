import type { DayTimes, PrayerDayContext } from "@/types";

/**
 * Deterministic times for testing the rule engine without invoking adhan.
 * Roughly models Jakarta (UTC+7) on an equinox-ish day; values are arbitrary
 * but internally consistent (monotonic within the day).
 */
export function makeDay(overrides: Partial<DayTimes> = {}): DayTimes {
  const d = (h: number, m: number) =>
    new Date(2026, 5, 6, h, m, 0, 0); // 2026-06-06 local
  return {
    fajr: d(4, 40),
    sunrise: d(6, 0),
    dhuhr: d(12, 0),
    asr: d(15, 20),
    maghrib: d(18, 0),
    isha: d(19, 10),
    ...overrides,
  };
}

export function makeContext(): PrayerDayContext {
  const today = makeDay();
  // Next day fajr a touch earlier — only the fajr field matters for Isha rules.
  const tomorrow = makeDay({ fajr: new Date(2026, 5, 7, 4, 41, 0, 0) });
  return { date: new Date(2026, 5, 6, 12, 0, 0, 0), today, tomorrow };
}
