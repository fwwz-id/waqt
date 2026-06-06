// ---------------------------------------------------------------------------
// Core domain types for Waktu Sholat.
// These are framework-agnostic and shared by the prayer engine, storage,
// notifications, and the UI. Keep this file free of React/DOM imports.
// ---------------------------------------------------------------------------

export type Language = "id" | "en";

export type Madhhab = "syafii" | "hanafi" | "maliki" | "hanbali";

export type CalculationMethod =
  | "auto"
  | "kemenag_id"
  | "umm_al_qura"
  | "muslim_world_league"
  | "isna"
  | "egypt"
  | "dubai"
  | "kuwait"
  | "qatar"
  | "turkey"
  | "singapore"
  | "moonsighting_committee";

export type PrayerName = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha";

/** Sunrise is not a prayer but is needed for Fajr's end and for the timeline. */
export type SolarEvent = "sunrise";

export type RuleAccuracy = "astronomical" | "fiqh_rule" | "heuristic";

export type PrayerStatus = "upcoming" | "active" | "ending_soon" | "ended";

/**
 * Identifies an end-time rule implementation. These are the rule "ids" the
 * fiqh engine knows how to resolve. The string union keeps storage + advanced
 * overrides type-safe.
 */
export type RuleId =
  | "next_prayer"
  | "sunrise"
  | "maghrib"
  | "isha_start"
  | "short_maghrib_window"
  | "one_third_night"
  | "half_night"
  | "fajr_next_day"
  | "asr_shadow_2x_heuristic"
  | "yellowing_sun_heuristic"
  | "isfar_heuristic";

export type LocationConfig = {
  label: string;
  city?: string;
  country?: string;
  countryCode?: string;
  lat: number;
  lng: number;
  timezone?: string;
};

export type HeuristicSettings = {
  shortMaghribMinutes: number;
  yellowingSunMinutesBeforeMaghrib: number;
  isfarMinutesBeforeSunrise: number;
};

export type NotificationSettings = {
  enabled: boolean;
  atStart: boolean;
  beforeStartMinutes: number[];
  beforeEndMinutes: number[];
};

export type AppSettings = {
  location?: LocationConfig;
  language: Language;
  madhhab: Madhhab;
  calculationMethod: CalculationMethod;
  advancedMode: boolean;
  heuristicSettings: HeuristicSettings;
  /** Per-prayer end-rule overrides (advanced mode). */
  customRules?: Partial<Record<PrayerName, RuleId>>;
  notifications: NotificationSettings;
};

// ---------------------------------------------------------------------------
// Prayer window — the central output of the engine.
// ---------------------------------------------------------------------------

export type PrayerWindow = {
  name: PrayerName;
  start: Date;
  end: Date;
  startLabel: string;
  endLabel: string;
  status: PrayerStatus;
  accuracy: RuleAccuracy;
  ruleId: RuleId;
  /** Human-readable Bahasa Indonesia explanation of the end-time rule. */
  explanation: string;
};

/** Raw astronomical times for a single day, as Date objects in local time. */
export type DayTimes = {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
};

/** Bundle needed to compute one day's windows (today + tomorrow's fajr). */
export type PrayerDayContext = {
  date: Date;
  today: DayTimes;
  tomorrow: DayTimes;
};
