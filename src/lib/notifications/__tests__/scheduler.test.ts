import { describe, it, expect } from "vitest";
import { computeReminders } from "../scheduler";
import type { NotificationSettings, PrayerWindow } from "@/types";

function win(
  name: PrayerWindow["name"],
  start: Date,
  end: Date,
): PrayerWindow {
  return {
    name,
    start,
    end,
    startLabel: "00:00",
    endLabel: "00:00",
    status: "upcoming",
    accuracy: "astronomical",
    ruleId: "next_prayer",
    explanation: "",
  };
}

const settings: NotificationSettings = {
  enabled: true,
  atStart: true,
  beforeStartMinutes: [15],
  beforeEndMinutes: [10, 5],
};

describe("computeReminders", () => {
  const now = new Date(2026, 5, 6, 12, 0);
  const windows = [
    win("asr", new Date(2026, 5, 6, 15, 20), new Date(2026, 5, 6, 18, 0)),
  ];

  it("returns nothing when notifications are disabled", () => {
    expect(computeReminders(windows, { ...settings, enabled: false }, now)).toEqual(
      [],
    );
  });

  it("schedules start, before-start and before-end reminders", () => {
    const reminders = computeReminders(windows, settings, now);
    const kinds = reminders.map((r) => r.kind).sort();
    expect(kinds).toEqual(["before_end", "before_end", "before_start", "start"]);
  });

  it("only schedules reminders in the future", () => {
    const reminders = computeReminders(windows, settings, now);
    expect(reminders.every((r) => r.fireAt.getTime() > now.getTime())).toBe(
      true,
    );
  });

  it("skips before-start reminders already in the past", () => {
    // now is 15:10, just before Asr 15:20 — the 15-min-before fired at 15:05.
    const late = new Date(2026, 5, 6, 15, 10);
    const reminders = computeReminders(windows, settings, late);
    expect(reminders.some((r) => r.kind === "before_start")).toBe(false);
    expect(reminders.some((r) => r.kind === "start")).toBe(true);
  });

  it("returns reminders sorted by fire time", () => {
    const reminders = computeReminders(windows, settings, now);
    const times = reminders.map((r) => r.fireAt.getTime());
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });
});
