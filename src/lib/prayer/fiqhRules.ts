import type {
  DayTimes,
  HeuristicSettings,
  PrayerName,
  RuleAccuracy,
  RuleId,
} from "@/types";
import type { Messages } from "@/lib/i18n/messages";

/**
 * Everything a rule needs to compute an end time. Pure data + a formatter and a
 * translated explanation dictionary, so rules build localized explanations
 * without importing React or date/tz libraries.
 */
export type RuleContext = {
  prayer: PrayerName;
  today: DayTimes;
  /** Tomorrow's times — required for Isha night-based rules and Hanafi Isha. */
  tomorrow: DayTimes;
  heuristics: HeuristicSettings;
  /** Format a Date to a short local time label, e.g. "18:42". */
  fmt: (d: Date) => string;
  /** Localized rule-explanation templates for the active language. */
  tr: Messages["ruleExplain"];
};

export type RuleDefinition = {
  id: RuleId;
  accuracy: RuleAccuracy;
  /** Which prayers this rule is a valid end-rule option for. */
  appliesTo: PrayerName[];
  computeEnd: (ctx: RuleContext) => Date;
  explain: (ctx: RuleContext) => string;
};

const MINUTE = 60_000;

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * MINUTE);
}

/**
 * Canonical ordering of solar/prayer events within a day, used by the generic
 * `next_prayer` rule to find the boundary that closes the current prayer.
 */
const ORDERED_EVENTS: { key: keyof DayTimes }[] = [
  { key: "fajr" },
  { key: "sunrise" },
  { key: "dhuhr" },
  { key: "asr" },
  { key: "maghrib" },
  { key: "isha" },
];

function nextEventStart(ctx: RuleContext): Date {
  const startKey: keyof DayTimes = ctx.prayer;
  const idx = ORDERED_EVENTS.findIndex((e) => e.key === startKey);
  const next = ORDERED_EVENTS[idx + 1];
  if (next) return ctx.today[next.key];
  // After Isha the "next" boundary is tomorrow's Fajr.
  return ctx.tomorrow.fajr;
}

/** Night span used by one_third_night / half_night (Maghrib -> next Fajr). */
function nightBounds(ctx: RuleContext): { start: Date; end: Date } {
  return { start: ctx.today.maghrib, end: ctx.tomorrow.fajr };
}

function thirdOfNight(ctx: RuleContext): Date {
  const { start, end } = nightBounds(ctx);
  return new Date(start.getTime() + (end.getTime() - start.getTime()) / 3);
}

function halfOfNight(ctx: RuleContext): Date {
  const { start, end } = nightBounds(ctx);
  return new Date(start.getTime() + (end.getTime() - start.getTime()) / 2);
}

export const RULES: Record<RuleId, RuleDefinition> = {
  next_prayer: {
    id: "next_prayer",
    accuracy: "fiqh_rule",
    appliesTo: ["dhuhr"],
    computeEnd: (ctx) => nextEventStart(ctx),
    explain: (ctx) =>
      ctx.tr.next_prayer({ time: ctx.fmt(nextEventStart(ctx)) }),
  },

  sunrise: {
    id: "sunrise",
    accuracy: "astronomical",
    appliesTo: ["fajr"],
    computeEnd: (ctx) => ctx.today.sunrise,
    explain: (ctx) => ctx.tr.sunrise({ time: ctx.fmt(ctx.today.sunrise) }),
  },

  maghrib: {
    id: "maghrib",
    accuracy: "astronomical",
    appliesTo: ["asr"],
    computeEnd: (ctx) => ctx.today.maghrib,
    explain: (ctx) => ctx.tr.maghrib({ time: ctx.fmt(ctx.today.maghrib) }),
  },

  isha_start: {
    id: "isha_start",
    accuracy: "astronomical",
    appliesTo: ["maghrib"],
    computeEnd: (ctx) => ctx.today.isha,
    explain: (ctx) => ctx.tr.isha_start({ time: ctx.fmt(ctx.today.isha) }),
  },

  short_maghrib_window: {
    id: "short_maghrib_window",
    accuracy: "heuristic",
    appliesTo: ["maghrib"],
    computeEnd: (ctx) =>
      addMinutes(ctx.today.maghrib, ctx.heuristics.shortMaghribMinutes),
    explain: (ctx) =>
      ctx.tr.short_maghrib_window({
        minutes: ctx.heuristics.shortMaghribMinutes,
        time: ctx.fmt(
          addMinutes(ctx.today.maghrib, ctx.heuristics.shortMaghribMinutes),
        ),
      }),
  },

  one_third_night: {
    id: "one_third_night",
    accuracy: "fiqh_rule",
    appliesTo: ["isha"],
    computeEnd: (ctx) => thirdOfNight(ctx),
    explain: (ctx) =>
      ctx.tr.one_third_night({
        maghrib: ctx.fmt(ctx.today.maghrib),
        time: ctx.fmt(thirdOfNight(ctx)),
      }),
  },

  half_night: {
    id: "half_night",
    accuracy: "fiqh_rule",
    appliesTo: ["isha"],
    computeEnd: (ctx) => halfOfNight(ctx),
    explain: (ctx) =>
      ctx.tr.half_night({
        maghrib: ctx.fmt(ctx.today.maghrib),
        time: ctx.fmt(halfOfNight(ctx)),
      }),
  },

  fajr_next_day: {
    id: "fajr_next_day",
    accuracy: "astronomical",
    appliesTo: ["isha"],
    computeEnd: (ctx) => ctx.tomorrow.fajr,
    explain: (ctx) => ctx.tr.fajr_next_day({ time: ctx.fmt(ctx.tomorrow.fajr) }),
  },

  asr_shadow_2x_heuristic: {
    id: "asr_shadow_2x_heuristic",
    accuracy: "fiqh_rule",
    appliesTo: ["asr"],
    // Practical approximation: Asr "ends" once Maghrib enters; the shadow-2x
    // concept relates to Asr *start*. We keep the end at Maghrib but surface
    // the heuristic label for advanced users.
    computeEnd: (ctx) => ctx.today.maghrib,
    explain: (ctx) =>
      ctx.tr.asr_shadow_2x_heuristic({ maghrib: ctx.fmt(ctx.today.maghrib) }),
  },

  yellowing_sun_heuristic: {
    id: "yellowing_sun_heuristic",
    accuracy: "heuristic",
    appliesTo: ["asr"],
    computeEnd: (ctx) =>
      addMinutes(
        ctx.today.maghrib,
        -ctx.heuristics.yellowingSunMinutesBeforeMaghrib,
      ),
    explain: (ctx) =>
      ctx.tr.yellowing_sun_heuristic({
        minutes: ctx.heuristics.yellowingSunMinutesBeforeMaghrib,
        time: ctx.fmt(
          addMinutes(
            ctx.today.maghrib,
            -ctx.heuristics.yellowingSunMinutesBeforeMaghrib,
          ),
        ),
      }),
  },

  isfar_heuristic: {
    id: "isfar_heuristic",
    accuracy: "heuristic",
    appliesTo: ["fajr"],
    computeEnd: (ctx) =>
      addMinutes(ctx.today.sunrise, -ctx.heuristics.isfarMinutesBeforeSunrise),
    explain: (ctx) =>
      ctx.tr.isfar_heuristic({
        minutes: ctx.heuristics.isfarMinutesBeforeSunrise,
        time: ctx.fmt(
          addMinutes(
            ctx.today.sunrise,
            -ctx.heuristics.isfarMinutesBeforeSunrise,
          ),
        ),
      }),
  },
};

export function getRule(ruleId: RuleId): RuleDefinition {
  return RULES[ruleId];
}

/** All rules valid as an end-rule option for a given prayer (advanced mode). */
export function rulesForPrayer(prayer: PrayerName): RuleDefinition[] {
  return Object.values(RULES).filter((r) => r.appliesTo.includes(prayer));
}
