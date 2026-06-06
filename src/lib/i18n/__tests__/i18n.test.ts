import { describe, it, expect } from "vitest";
import { dictionaries, getMessages, localeFor } from "../messages";
import { buildPrayerWindows } from "@/lib/prayer/prayerWindows";
import { makeContext } from "@/lib/prayer/__tests__/fixtures";
import type { AppSettings } from "@/types";

const settings: Pick<
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

describe("i18n dictionaries", () => {
  it("exposes both languages with matching key shapes", () => {
    const idKeys = Object.keys(dictionaries.id).sort();
    const enKeys = Object.keys(dictionaries.en).sort();
    expect(enKeys).toEqual(idKeys);
  });

  it("translates prayer names per language", () => {
    expect(getMessages("id").prayers.fajr).toBe("Subuh");
    expect(getMessages("en").prayers.fajr).toBe("Fajr");
  });

  it("maps language to an Intl locale", () => {
    expect(localeFor("id")).toBe("id-ID");
    expect(localeFor("en")).toBe("en-US");
  });
});

describe("language threads into the prayer engine", () => {
  it("produces explanations in the requested language", () => {
    const context = makeContext();
    const en = buildPrayerWindows({
      context,
      settings,
      timeZone: "Asia/Jakarta",
      lang: "en",
    });
    const idw = buildPrayerWindows({
      context,
      settings,
      timeZone: "Asia/Jakarta",
      lang: "id",
    });
    const enFajr = en.find((w) => w.name === "fajr")!;
    const idFajr = idw.find((w) => w.name === "fajr")!;
    expect(enFajr.explanation).toMatch(/Fajr ends at sunrise/);
    expect(idFajr.explanation).toMatch(/Subuh/);
    expect(enFajr.explanation).not.toBe(idFajr.explanation);
  });
});
