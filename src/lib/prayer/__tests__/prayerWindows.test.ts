import { describe, it, expect } from "vitest";
import { buildPrayerWindows, currentOrNextWindow } from "../prayerWindows";
import { makeContext } from "./fixtures";
import type { AppSettings } from "@/types";

const baseSettings: Pick<
  AppSettings,
  "madhhab" | "heuristicSettings" | "customRules"
> = {
  madhhab: "syafii",
  heuristicSettings: {
    shortMaghribMinutes: 15,
    yellowingSunMinutesBeforeMaghrib: 30,
    isfarMinutesBeforeSunrise: 20,
  },
  customRules: {},
};

describe("buildPrayerWindows", () => {
  it("produces the five prayers in order with start = astronomical time", () => {
    const context = makeContext();
    const windows = buildPrayerWindows({
      context,
      settings: baseSettings,
      timeZone: "Asia/Jakarta",
      now: new Date(2026, 5, 6, 10, 0),
    });
    expect(windows.map((w) => w.name)).toEqual([
      "fajr",
      "dhuhr",
      "asr",
      "maghrib",
      "isha",
    ]);
    expect(windows[0].start).toEqual(context.today.fajr);
    // Syafi'i Maghrib end = short window (heuristic), Isha end = half night.
    expect(windows[3].ruleId).toBe("short_maghrib_window");
    expect(windows[3].accuracy).toBe("heuristic");
    expect(windows[4].ruleId).toBe("half_night");
  });

  it("applies advanced custom rule overrides", () => {
    const context = makeContext();
    const windows = buildPrayerWindows({
      context,
      settings: { ...baseSettings, customRules: { isha: "fajr_next_day" } },
      timeZone: "Asia/Jakarta",
    });
    const isha = windows.find((w) => w.name === "isha")!;
    expect(isha.ruleId).toBe("fajr_next_day");
    expect(isha.end).toEqual(context.tomorrow.fajr);
  });

  it("uses Hanafi profile defaults (Maghrib -> Isha, Isha -> next Fajr)", () => {
    const context = makeContext();
    const windows = buildPrayerWindows({
      context,
      settings: { ...baseSettings, madhhab: "hanafi" },
      timeZone: "Asia/Jakarta",
    });
    expect(windows.find((w) => w.name === "maghrib")!.ruleId).toBe(
      "isha_start",
    );
    expect(windows.find((w) => w.name === "isha")!.ruleId).toBe(
      "fajr_next_day",
    );
  });

  it("computes status relative to now", () => {
    const context = makeContext();
    // 15:40 — inside Asr (15:20 -> 18:00).
    const windows = buildPrayerWindows({
      context,
      settings: baseSettings,
      timeZone: "Asia/Jakarta",
      now: new Date(2026, 5, 6, 15, 40),
    });
    const asr = windows.find((w) => w.name === "asr")!;
    expect(["active", "ending_soon"]).toContain(asr.status);
    expect(windows.find((w) => w.name === "fajr")!.status).toBe("ended");
    expect(windows.find((w) => w.name === "isha")!.status).toBe("upcoming");
  });
});

describe("currentOrNextWindow", () => {
  it("returns the active window when inside one", () => {
    const context = makeContext();
    const now = new Date(2026, 5, 6, 15, 40);
    const windows = buildPrayerWindows({
      context,
      settings: baseSettings,
      timeZone: "Asia/Jakarta",
      now,
    });
    const { window, isActive } = currentOrNextWindow(windows, now);
    expect(window.name).toBe("asr");
    expect(isActive).toBe(true);
  });

  it("returns the next upcoming window when between prayers", () => {
    const context = makeContext();
    // 06:30 — after sunrise, before Dhuhr (Fajr ended at sunrise 06:00).
    const now = new Date(2026, 5, 6, 6, 30);
    const windows = buildPrayerWindows({
      context,
      settings: baseSettings,
      timeZone: "Asia/Jakarta",
      now,
    });
    const { window, isActive } = currentOrNextWindow(windows, now);
    expect(window.name).toBe("dhuhr");
    expect(isActive).toBe(false);
  });
});
