import { describe, it, expect } from "vitest";
import { RULES, getRule, rulesForPrayer } from "../fiqhRules";
import type { RuleContext } from "../fiqhRules";
import { makeContext } from "./fixtures";
import { getMessages } from "@/lib/i18n/messages";
import type { HeuristicSettings, PrayerName } from "@/types";

const heuristics: HeuristicSettings = {
  shortMaghribMinutes: 15,
  yellowingSunMinutesBeforeMaghrib: 30,
  isfarMinutesBeforeSunrise: 20,
};

function ctx(prayer: PrayerName): RuleContext {
  const c = makeContext();
  return {
    prayer,
    today: c.today,
    tomorrow: c.tomorrow,
    heuristics,
    fmt: (d) =>
      `${String(d.getHours()).padStart(2, "0")}:${String(
        d.getMinutes(),
      ).padStart(2, "0")}`,
    tr: getMessages("id").ruleExplain,
  };
}

describe("fiqh rule engine — end-time computation", () => {
  it("sunrise: Fajr ends at sunrise", () => {
    const c = ctx("fajr");
    expect(RULES.sunrise.computeEnd(c)).toEqual(c.today.sunrise);
  });

  it("next_prayer: Dhuhr ends at Asr start", () => {
    const c = ctx("dhuhr");
    expect(RULES.next_prayer.computeEnd(c)).toEqual(c.today.asr);
  });

  it("maghrib: Asr ends at Maghrib", () => {
    const c = ctx("asr");
    expect(RULES.maghrib.computeEnd(c)).toEqual(c.today.maghrib);
  });

  it("isha_start: Maghrib ends at Isha start", () => {
    const c = ctx("maghrib");
    expect(RULES.isha_start.computeEnd(c)).toEqual(c.today.isha);
  });

  it("short_maghrib_window: Maghrib + configured minutes", () => {
    const c = ctx("maghrib");
    const end = RULES.short_maghrib_window.computeEnd(c);
    expect(end.getTime() - c.today.maghrib.getTime()).toBe(15 * 60_000);
  });

  it("fajr_next_day: Isha ends at tomorrow's Fajr", () => {
    const c = ctx("isha");
    expect(RULES.fajr_next_day.computeEnd(c)).toEqual(c.tomorrow.fajr);
  });

  it("half_night: midpoint between Maghrib and next Fajr", () => {
    const c = ctx("isha");
    const end = RULES.half_night.computeEnd(c);
    const expected =
      c.today.maghrib.getTime() +
      (c.tomorrow.fajr.getTime() - c.today.maghrib.getTime()) / 2;
    expect(end.getTime()).toBe(expected);
    // Sanity: half-night should be after Isha start and before next Fajr.
    expect(end.getTime()).toBeGreaterThan(c.today.isha.getTime());
    expect(end.getTime()).toBeLessThan(c.tomorrow.fajr.getTime());
  });

  it("one_third_night: a third into the night, earlier than half-night", () => {
    const c = ctx("isha");
    const third = RULES.one_third_night.computeEnd(c).getTime();
    const half = RULES.half_night.computeEnd(c).getTime();
    expect(third).toBeLessThan(half);
    const expected =
      c.today.maghrib.getTime() +
      (c.tomorrow.fajr.getTime() - c.today.maghrib.getTime()) / 3;
    expect(third).toBe(expected);
  });

  it("yellowing_sun_heuristic: minutes before Maghrib", () => {
    const c = ctx("asr");
    const end = RULES.yellowing_sun_heuristic.computeEnd(c);
    expect(c.today.maghrib.getTime() - end.getTime()).toBe(30 * 60_000);
  });

  it("isfar_heuristic: minutes before sunrise", () => {
    const c = ctx("fajr");
    const end = RULES.isfar_heuristic.computeEnd(c);
    expect(c.today.sunrise.getTime() - end.getTime()).toBe(20 * 60_000);
  });
});

describe("rule metadata", () => {
  it("exposes the documented accuracy per rule", () => {
    expect(getRule("sunrise").accuracy).toBe("astronomical");
    expect(getRule("half_night").accuracy).toBe("fiqh_rule");
    expect(getRule("short_maghrib_window").accuracy).toBe("heuristic");
  });

  it("only offers rules valid for the given prayer", () => {
    expect(rulesForPrayer("isha").map((r) => r.id).sort()).toEqual(
      ["fajr_next_day", "half_night", "one_third_night"].sort(),
    );
    expect(rulesForPrayer("fajr").every((r) => r.appliesTo.includes("fajr")))
      .toBe(true);
  });

  it("every rule produces a non-empty Indonesian explanation", () => {
    for (const prayer of ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const) {
      for (const rule of rulesForPrayer(prayer)) {
        expect(rule.explain(ctx(prayer)).length).toBeGreaterThan(10);
      }
    }
  });
});
