import type {
  AppSettings,
  Language,
  PrayerDayContext,
  PrayerName,
  RuleAccuracy,
  RuleId,
} from "@/types";
import { resolveEndRule } from "./fiqhProfiles";
import { getRule, rulesForPrayer, type RuleContext } from "./fiqhRules";
import { effectiveTimeZone, formatTime } from "@/lib/utils/datetime";
import { getMessages, localeFor } from "@/lib/i18n/messages";

export type EndTimeAlternative = {
  ruleId: RuleId;
  label: string;
  accuracy: RuleAccuracy;
  endLabel: string;
  end: Date;
  isCurrent: boolean;
};

type EndSettings = Pick<
  AppSettings,
  "madhhab" | "heuristicSettings" | "customRules"
>;

function makeRuleContext(
  prayer: PrayerName,
  context: PrayerDayContext,
  settings: EndSettings,
  fmt: (d: Date) => string,
  lang: Language,
): RuleContext {
  return {
    prayer,
    today: context.today,
    tomorrow: context.tomorrow,
    heuristics: settings.heuristicSettings,
    fmt,
    tr: getMessages(lang).ruleExplain,
  };
}

/**
 * All valid end-rule options for a prayer with the time each would produce,
 * used by the prayer-detail "alternative opinions" section and advanced mode.
 */
export function endTimeAlternatives(
  prayer: PrayerName,
  context: PrayerDayContext,
  settings: EndSettings,
  timeZone: string | undefined,
  lang: Language = "id",
): EndTimeAlternative[] {
  const tz = effectiveTimeZone(timeZone);
  const fmt = (d: Date) => formatTime(d, tz, localeFor(lang));
  const labels = getMessages(lang).ruleLabel;
  const current = resolveEndRule(settings.madhhab, prayer, settings.customRules);

  return rulesForPrayer(prayer).map((rule) => {
    const ctx = makeRuleContext(prayer, context, settings, fmt, lang);
    const end = rule.computeEnd(ctx);
    return {
      ruleId: rule.id,
      label: labels[rule.id],
      accuracy: rule.accuracy,
      end,
      endLabel: fmt(end),
      isCurrent: rule.id === current,
    };
  });
}

/** Full explanation paragraph for the currently-selected rule of a prayer. */
export function explainCurrentRule(
  prayer: PrayerName,
  context: PrayerDayContext,
  settings: EndSettings,
  timeZone: string | undefined,
  lang: Language = "id",
): string {
  const tz = effectiveTimeZone(timeZone);
  const fmt = (d: Date) => formatTime(d, tz, localeFor(lang));
  const ruleId = resolveEndRule(settings.madhhab, prayer, settings.customRules);
  const rule = getRule(ruleId);
  return rule.explain(makeRuleContext(prayer, context, settings, fmt, lang));
}
