import type {
  AppSettings,
  Language,
  PrayerDayContext,
  PrayerName,
  PrayerWindow,
} from "@/types";
import { resolveEndRule } from "./fiqhProfiles";
import { getRule, type RuleContext } from "./fiqhRules";
import { PRAYER_ORDER } from "./labels";
import { computeStatus, ENDING_SOON_MINUTES } from "./status";
import { effectiveTimeZone, formatTime } from "@/lib/utils/datetime";
import { getMessages, localeFor } from "@/lib/i18n/messages";

const PRAYER_START_KEY: Record<PrayerName, keyof PrayerDayContext["today"]> = {
  fajr: "fajr",
  dhuhr: "dhuhr",
  asr: "asr",
  maghrib: "maghrib",
  isha: "isha",
};

export type BuildWindowsInput = {
  context: PrayerDayContext;
  settings: Pick<
    AppSettings,
    "madhhab" | "heuristicSettings" | "customRules"
  >;
  timeZone?: string;
  now?: Date;
  /** UI language for end-time explanations and time labels. */
  lang?: Language;
};

/**
 * Produce the five prayer windows for the day described by `context`.
 * Start times come straight from astronomy; end times come from the resolved
 * fiqh rule (madhhab profile default, overridden by advanced custom rules).
 */
export function buildPrayerWindows(input: BuildWindowsInput): PrayerWindow[] {
  const { context, settings } = input;
  const lang = input.lang ?? "id";
  const tz = effectiveTimeZone(input.timeZone);
  const now = input.now ?? new Date();
  const messages = getMessages(lang);
  const fmt = (d: Date) => formatTime(d, tz, localeFor(lang));

  return PRAYER_ORDER.map((name): PrayerWindow => {
    const start = context.today[PRAYER_START_KEY[name]];
    const ruleId = resolveEndRule(settings.madhhab, name, settings.customRules);
    const rule = getRule(ruleId);

    const ruleCtx: RuleContext = {
      prayer: name,
      today: context.today,
      tomorrow: context.tomorrow,
      heuristics: settings.heuristicSettings,
      fmt,
      tr: messages.ruleExplain,
    };

    const end = rule.computeEnd(ruleCtx);
    const status = computeStatus(now, start, end, ENDING_SOON_MINUTES);

    return {
      name,
      start,
      end,
      startLabel: fmt(start),
      endLabel: fmt(end),
      status,
      accuracy: rule.accuracy,
      ruleId: rule.id,
      explanation: rule.explain(ruleCtx),
    };
  });
}

/**
 * The window the user is currently in, or the next upcoming one if between
 * prayers (e.g. after Sunrise before Dhuhr). Falls back to the first window
 * of the day if everything has ended (caller should recompute for next day).
 */
export function currentOrNextWindow(
  windows: PrayerWindow[],
  now: Date = new Date(),
): { window: PrayerWindow; isActive: boolean } {
  const active = windows.find(
    (w) => w.status === "active" || w.status === "ending_soon",
  );
  if (active) return { window: active, isActive: true };

  const upcoming = windows
    .filter((w) => w.start.getTime() > now.getTime())
    .sort((a, b) => a.start.getTime() - b.start.getTime())[0];
  if (upcoming) return { window: upcoming, isActive: false };

  // Everything today has ended — surface the last window; the timeline view
  // will roll over to tomorrow on the next midnight recompute.
  return { window: windows[windows.length - 1], isActive: false };
}
