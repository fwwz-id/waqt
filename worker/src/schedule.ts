import { Coordinates, PrayerTimes, CalculationMethod, Madhab } from "adhan";

/**
 * Server-side reminder scheduling. This mirrors the frontend scheduler closely
 * enough for reliable push, using adhan directly. For full parity with the
 * advanced fiqh end-time rules you can share `src/lib/prayer/*` as a workspace
 * package; the MVP here uses start-based reminders plus a next-prayer end.
 */

export type StoredSettings = {
  lat: number;
  lng: number;
  madhhab: string;
  calculation_method: string;
  country_code: string | null;
  at_start: number;
  before_start_minutes: string;
  before_end_minutes: string;
};

type Reminder = { fireAt: number; title: string; body: string; prayer: string };

const PRAYER_LABELS: Record<string, string> = {
  fajr: "Subuh",
  dhuhr: "Dzuhur",
  asr: "Ashar",
  maghrib: "Maghrib",
  isha: "Isya",
};

function params(method: string, madhhab: string, countryCode: string | null) {
  let p;
  const m = method === "auto" ? autoMethod(countryCode) : method;
  switch (m) {
    case "kemenag_id": {
      p = CalculationMethod.Other();
      p.fajrAngle = 20;
      p.ishaAngle = 18;
      break;
    }
    case "umm_al_qura":
      p = CalculationMethod.UmmAlQura();
      break;
    case "isna":
      p = CalculationMethod.NorthAmerica();
      break;
    case "egypt":
      p = CalculationMethod.Egyptian();
      break;
    case "singapore":
      p = CalculationMethod.Singapore();
      break;
    case "turkey":
      p = CalculationMethod.Turkey();
      break;
    case "dubai":
      p = CalculationMethod.Dubai();
      break;
    case "kuwait":
      p = CalculationMethod.Kuwait();
      break;
    case "qatar":
      p = CalculationMethod.Qatar();
      break;
    default:
      p = CalculationMethod.MuslimWorldLeague();
  }
  p.madhab = madhhab === "hanafi" ? Madhab.Hanafi : Madhab.Shafi;
  return p;
}

function autoMethod(cc: string | null): string {
  switch ((cc ?? "").toUpperCase()) {
    case "ID":
      return "kemenag_id";
    case "SA":
      return "umm_al_qura";
    case "SG":
      return "singapore";
    case "US":
    case "CA":
      return "isna";
    default:
      return "muslim_world_league";
  }
}

function timesFor(s: StoredSettings, date: Date): Record<string, Date> {
  const pt = new PrayerTimes(
    new Coordinates(s.lat, s.lng),
    date,
    params(s.calculation_method, s.madhhab, s.country_code),
  );
  return {
    fajr: pt.fajr,
    sunrise: pt.sunrise,
    dhuhr: pt.dhuhr,
    asr: pt.asr,
    maghrib: pt.maghrib,
    isha: pt.isha,
  };
}

/** Build all of today's reminders for a user (start + before-start + before-end). */
export function buildReminders(s: StoredSettings, now: Date): Reminder[] {
  const today = timesFor(s, now);
  const tomorrow = timesFor(s, new Date(now.getTime() + 86_400_000));
  const order = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const;
  const beforeStart = safeParse(s.before_start_minutes);
  const beforeEnd = safeParse(s.before_end_minutes);
  const reminders: Reminder[] = [];

  // Simple end map: next prayer start; Fajr ends at sunrise; Isha ends at next Fajr.
  const ends: Record<string, Date> = {
    fajr: today.sunrise,
    dhuhr: today.asr,
    asr: today.maghrib,
    maghrib: today.isha,
    isha: tomorrow.fajr,
  };

  for (const name of order) {
    const label = PRAYER_LABELS[name];
    const start = today[name];
    if (s.at_start) {
      reminders.push({
        fireAt: start.getTime(),
        prayer: name,
        title: `Waktu ${label} telah masuk`,
        body: `Sekarang masuk waktu ${label}.`,
      });
    }
    for (const m of beforeStart) {
      reminders.push({
        fireAt: start.getTime() - m * 60_000,
        prayer: name,
        title: `${label} sebentar lagi`,
        body: `${m} menit lagi menuju waktu ${label}.`,
      });
    }
    for (const m of beforeEnd) {
      reminders.push({
        fireAt: ends[name].getTime() - m * 60_000,
        prayer: name,
        title: `Waktu ${label} hampir habis`,
        body: `Estimasi akhir waktu ${label} sekitar ${m} menit lagi.`,
      });
    }
  }
  return reminders.sort((a, b) => a.fireAt - b.fireAt);
}

/** The reminder due in the window (prev, now], plus the next future fire time. */
export function dueAndNext(
  s: StoredSettings,
  now: number,
  windowMs: number,
): { due: Reminder[]; nextAt: number | null } {
  const reminders = buildReminders(s, new Date(now));
  const due = reminders.filter(
    (r) => r.fireAt <= now && r.fireAt > now - windowMs,
  );
  const next = reminders.find((r) => r.fireAt > now);
  return { due, nextAt: next?.fireAt ?? null };
}

function safeParse(s: string): number[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}
