import * as React from "react";
import { useSettings } from "@/app/SettingsContext";
import {
  computeDayContext,
  hasInvalidTimes,
} from "@/lib/prayer/calculation";
import { buildPrayerWindows } from "@/lib/prayer/prayerWindows";
import type { PrayerDayContext, PrayerWindow } from "@/types";
import { effectiveTimeZone, partsInTimeZone } from "@/lib/utils/datetime";
import { useNow } from "./useNow";

export type PrayerDay = {
  context: PrayerDayContext | null;
  windows: PrayerWindow[];
  timeZone: string;
  /** Set when coordinates are missing/invalid or astronomy returned NaN. */
  error: string | null;
  /** True at extreme latitudes where Fajr/Isha may be unreliable. */
  highLatitudeWarning: boolean;
};

/**
 * Compute the day's context + prayer windows from settings. The astronomical
 * context is memoized per calendar day (recomputes at midnight); window status
 * refreshes every minute via the coarse clock.
 */
export function usePrayerDay(): PrayerDay {
  const { settings } = useSettings();
  const minuteNow = useNow(30_000);
  const loc = settings.location;
  const tz = effectiveTimeZone(loc?.timezone);

  // Key that changes once per local calendar day.
  const dayParts = partsInTimeZone(minuteNow, tz);
  const dayKey = `${dayParts.year}-${dayParts.month}-${dayParts.day}`;

  const context = React.useMemo<PrayerDayContext | null>(() => {
    if (!loc) return null;
    try {
      return computeDayContext({
        location: loc,
        madhhab: settings.madhhab,
        method: settings.calculationMethod,
        now: minuteNow,
      });
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    loc?.lat,
    loc?.lng,
    loc?.countryCode,
    loc?.timezone,
    settings.madhhab,
    settings.calculationMethod,
    dayKey,
  ]);

  const windows = React.useMemo<PrayerWindow[]>(() => {
    if (!context) return [];
    return buildPrayerWindows({
      context,
      settings,
      timeZone: tz,
      now: minuteNow,
      lang: settings.language,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    context,
    settings.madhhab,
    settings.heuristicSettings,
    settings.customRules,
    settings.language,
    tz,
    minuteNow,
  ]);

  const error = !loc
    ? "Lokasi belum diatur."
    : !context
      ? "Tidak dapat menghitung waktu sholat untuk lokasi ini."
      : null;

  const highLatitudeWarning =
    !!context &&
    (Math.abs(loc?.lat ?? 0) >= 48 ||
      hasInvalidTimes(context.today) ||
      hasInvalidTimes(context.tomorrow));

  return { context, windows, timeZone: tz, error, highLatitudeWarning };
}
