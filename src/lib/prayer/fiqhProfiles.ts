import type { Madhhab, PrayerName, RuleId } from "@/types";

export type MadhhabProfile = {
  id: Madhhab;
  label: string;
  /** Asr shadow factor for the *start* of Asr. */
  asrShadowFactor: 1 | 2;
  /** Default end rule per prayer (the majority opinion for this profile). */
  endRules: Record<PrayerName, RuleId>;
  /** Short description shown in the settings selector. */
  description: string;
};

/**
 * MVP defaults. These encode the *majority opinion within each profile* for
 * end-time rules. They are configurable product heuristics, not final fatwa —
 * the UI must present them as such.
 */
export const MADHHAB_PROFILES: Record<Madhhab, MadhhabProfile> = {
  syafii: {
    id: "syafii",
    label: "Syafi'i",
    asrShadowFactor: 1,
    description:
      "Mayoritas di Indonesia. Awal Ashar memakai bayangan 1x. Akhir Isya hingga tengah malam.",
    endRules: {
      fajr: "sunrise",
      dhuhr: "next_prayer",
      asr: "maghrib",
      maghrib: "short_maghrib_window",
      isha: "half_night",
    },
  },
  hanafi: {
    id: "hanafi",
    label: "Hanafi",
    asrShadowFactor: 2,
    description:
      "Awal Ashar memakai bayangan 2x. Akhir Maghrib hingga Isya, akhir Isya hingga Subuh.",
    endRules: {
      fajr: "sunrise",
      dhuhr: "next_prayer",
      asr: "maghrib",
      maghrib: "isha_start",
      isha: "fajr_next_day",
    },
  },
  maliki: {
    id: "maliki",
    label: "Maliki",
    asrShadowFactor: 1,
    description:
      "Awal Ashar memakai bayangan 1x. Akhir Isya hingga sepertiga malam.",
    endRules: {
      fajr: "sunrise",
      dhuhr: "next_prayer",
      asr: "maghrib",
      maghrib: "isha_start",
      isha: "one_third_night",
    },
  },
  hanbali: {
    id: "hanbali",
    label: "Hanbali",
    asrShadowFactor: 1,
    description:
      "Awal Ashar memakai bayangan 1x. Akhir Isya hingga tengah malam.",
    endRules: {
      fajr: "sunrise",
      dhuhr: "next_prayer",
      asr: "maghrib",
      maghrib: "isha_start",
      isha: "half_night",
    },
  },
};

export const MADHHAB_LIST = Object.values(MADHHAB_PROFILES);

export function getProfile(madhhab: Madhhab): MadhhabProfile {
  return MADHHAB_PROFILES[madhhab];
}

/**
 * Resolve the effective end rule for a prayer, applying any advanced-mode
 * override on top of the madhhab profile default.
 */
export function resolveEndRule(
  madhhab: Madhhab,
  prayer: PrayerName,
  overrides?: Partial<Record<PrayerName, RuleId>>,
): RuleId {
  const override = overrides?.[prayer];
  if (override) return override;
  return getProfile(madhhab).endRules[prayer];
}
