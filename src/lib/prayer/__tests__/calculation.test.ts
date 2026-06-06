import { describe, it, expect } from "vitest";
import { resolveAutoMethod, buildCalculationParameters } from "../methods";
import { computeDayContext } from "../calculation";

describe("calculation method resolution", () => {
  it("maps country codes to sensible defaults", () => {
    expect(resolveAutoMethod("ID")).toBe("kemenag_id");
    expect(resolveAutoMethod("SA")).toBe("umm_al_qura");
    expect(resolveAutoMethod("SG")).toBe("singapore");
    expect(resolveAutoMethod("US")).toBe("isna");
    expect(resolveAutoMethod("ZZ")).toBe("muslim_world_league");
    expect(resolveAutoMethod(undefined)).toBe("muslim_world_league");
  });

  it("Kemenag custom params use Fajr 20 / Isha 18", () => {
    const { params, resolvedMethod } = buildCalculationParameters(
      "auto",
      "syafii",
      "ID",
    );
    expect(resolvedMethod).toBe("kemenag_id");
    expect(params.fajrAngle).toBe(20);
    expect(params.ishaAngle).toBe(18);
  });

  it("Hanafi switches Asr shadow factor (madhab = Hanafi)", () => {
    const shafi = buildCalculationParameters("muslim_world_league", "syafii");
    const hanafi = buildCalculationParameters("muslim_world_league", "hanafi");
    expect(hanafi.params.madhab).not.toBe(shafi.params.madhab);
  });
});

describe("computeDayContext (real adhan)", () => {
  it("computes ordered times for Jakarta and includes tomorrow's Fajr", () => {
    const ctx = computeDayContext({
      location: { lat: -6.2, lng: 106.8, countryCode: "ID", timezone: "Asia/Jakarta" },
      madhhab: "syafii",
      method: "auto",
      now: new Date("2026-06-06T05:00:00Z"),
    });
    const t = ctx.today;
    expect(t.fajr.getTime()).toBeLessThan(t.sunrise.getTime());
    expect(t.sunrise.getTime()).toBeLessThan(t.dhuhr.getTime());
    expect(t.dhuhr.getTime()).toBeLessThan(t.asr.getTime());
    expect(t.asr.getTime()).toBeLessThan(t.maghrib.getTime());
    expect(t.maghrib.getTime()).toBeLessThan(t.isha.getTime());
    // Tomorrow's Fajr must be after today's Isha (needed for night rules).
    expect(ctx.tomorrow.fajr.getTime()).toBeGreaterThan(t.isha.getTime());
  });

  it("Hanafi Asr is later than Shafi'i Asr (shadow 2x)", () => {
    const loc = { lat: -6.2, lng: 106.8, countryCode: "ID" as const };
    const now = new Date("2026-06-06T05:00:00Z");
    const shafi = computeDayContext({ location: loc, madhhab: "syafii", method: "auto", now });
    const hanafi = computeDayContext({ location: loc, madhhab: "hanafi", method: "auto", now });
    expect(hanafi.today.asr.getTime()).toBeGreaterThan(
      shafi.today.asr.getTime(),
    );
  });

  it("throws on invalid coordinates", () => {
    expect(() =>
      computeDayContext({
        location: { lat: 999, lng: 0 },
        madhhab: "syafii",
        method: "auto",
      }),
    ).toThrow();
  });
});
