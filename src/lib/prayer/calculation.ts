import { Coordinates, PrayerTimes } from "adhan";
import type {
  CalculationMethod,
  DayTimes,
  LocationConfig,
  Madhhab,
  PrayerDayContext,
} from "@/types";
import { buildCalculationParameters } from "./methods";
import {
  adhanDateFor,
  effectiveTimeZone,
  nextDayParts,
  partsInTimeZone,
  type DateParts,
} from "@/lib/utils/datetime";

export type CalcInput = {
  location: Pick<LocationConfig, "lat" | "lng" | "countryCode" | "timezone">;
  madhhab: Madhhab;
  method: CalculationMethod;
  /** Reference instant; defaults to "now". Used to derive the local day. */
  now?: Date;
};

function isValidCoord(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function dayTimesFor(
  coords: Coordinates,
  parts: DateParts,
  params: ReturnType<typeof buildCalculationParameters>["params"],
): DayTimes {
  const pt = new PrayerTimes(coords, adhanDateFor(parts), params);
  return {
    fajr: pt.fajr,
    sunrise: pt.sunrise,
    dhuhr: pt.dhuhr,
    asr: pt.asr,
    maghrib: pt.maghrib,
    isha: pt.isha,
  };
}

/**
 * Compute today's + tomorrow's astronomical times. Tomorrow's Fajr is required
 * to close the Isha window (night-based rules) and for the Hanafi profile.
 *
 * Throws on invalid coordinates — callers should guard with `isValidCoord`
 * (re-exported as {@link coordinatesValid}).
 */
export function computeDayContext(input: CalcInput): PrayerDayContext {
  const { location, madhhab, method } = input;
  if (!isValidCoord(location.lat, location.lng)) {
    throw new Error("Koordinat lokasi tidak valid.");
  }

  const now = input.now ?? new Date();
  const tz = effectiveTimeZone(location.timezone);
  const todayParts = partsInTimeZone(now, tz);
  const tomorrowParts = nextDayParts(todayParts);

  const coords = new Coordinates(location.lat, location.lng);
  const { params } = buildCalculationParameters(
    method,
    madhhab,
    location.countryCode,
  );

  return {
    date: adhanDateFor(todayParts),
    today: dayTimesFor(coords, todayParts, params),
    tomorrow: dayTimesFor(coords, tomorrowParts, params),
  };
}

/**
 * Detect high-latitude / polar edge cases where adhan may return Invalid Date
 * for Fajr or Isha. Callers can show a warning and still render the rest.
 */
export function hasInvalidTimes(times: DayTimes): boolean {
  return Object.values(times).some((d) => Number.isNaN(d.getTime()));
}

export const coordinatesValid = isValidCoord;
