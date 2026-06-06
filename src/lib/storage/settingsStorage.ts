import type { AppSettings } from "@/types";

const STORAGE_KEY = "waqt.settings.v1";
const USER_ID_KEY = "waqt.userId.v1";

/** Default to the device language when it's English, otherwise Indonesian. */
function detectLanguage(): AppSettings["language"] {
  try {
    const lang = (navigator?.language ?? "").toLowerCase();
    return lang.startsWith("en") ? "en" : "id";
  } catch {
    return "id";
  }
}

export const DEFAULT_SETTINGS: AppSettings = {
  location: undefined,
  language: "id",
  madhhab: "syafii",
  calculationMethod: "auto",
  advancedMode: false,
  heuristicSettings: {
    shortMaghribMinutes: 15,
    yellowingSunMinutesBeforeMaghrib: 30,
    isfarMinutesBeforeSunrise: 20,
  },
  customRules: {},
  notifications: {
    enabled: false,
    atStart: true,
    beforeStartMinutes: [15],
    beforeEndMinutes: [10, 5],
  },
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/**
 * Merge persisted settings over defaults defensively so a partial / older blob
 * never produces an invalid settings object. Unknown fields are dropped.
 */
function coerceSettings(raw: unknown): AppSettings {
  if (!isObject(raw)) return { ...DEFAULT_SETTINGS };
  const d = DEFAULT_SETTINGS;
  const heur = isObject(raw.heuristicSettings) ? raw.heuristicSettings : {};
  const notif = isObject(raw.notifications) ? raw.notifications : {};
  const loc = isObject(raw.location) ? (raw.location as AppSettings["location"]) : undefined;

  return {
    location:
      loc &&
      typeof loc.lat === "number" &&
      typeof loc.lng === "number" &&
      typeof loc.label === "string"
        ? loc
        : undefined,
    language: (["id", "en"] as const).includes(raw.language as never)
      ? (raw.language as AppSettings["language"])
      : detectLanguage(),
    madhhab: (["syafii", "hanafi", "maliki", "hanbali"] as const).includes(
      raw.madhhab as never,
    )
      ? (raw.madhhab as AppSettings["madhhab"])
      : d.madhhab,
    calculationMethod:
      typeof raw.calculationMethod === "string"
        ? (raw.calculationMethod as AppSettings["calculationMethod"])
        : d.calculationMethod,
    advancedMode:
      typeof raw.advancedMode === "boolean" ? raw.advancedMode : d.advancedMode,
    heuristicSettings: {
      shortMaghribMinutes:
        typeof heur.shortMaghribMinutes === "number"
          ? heur.shortMaghribMinutes
          : d.heuristicSettings.shortMaghribMinutes,
      yellowingSunMinutesBeforeMaghrib:
        typeof heur.yellowingSunMinutesBeforeMaghrib === "number"
          ? heur.yellowingSunMinutesBeforeMaghrib
          : d.heuristicSettings.yellowingSunMinutesBeforeMaghrib,
      isfarMinutesBeforeSunrise:
        typeof heur.isfarMinutesBeforeSunrise === "number"
          ? heur.isfarMinutesBeforeSunrise
          : d.heuristicSettings.isfarMinutesBeforeSunrise,
    },
    customRules: isObject(raw.customRules)
      ? (raw.customRules as AppSettings["customRules"])
      : {},
    notifications: {
      enabled:
        typeof notif.enabled === "boolean"
          ? notif.enabled
          : d.notifications.enabled,
      atStart:
        typeof notif.atStart === "boolean"
          ? notif.atStart
          : d.notifications.atStart,
      beforeStartMinutes: Array.isArray(notif.beforeStartMinutes)
        ? (notif.beforeStartMinutes as number[]).filter(
            (n) => typeof n === "number",
          )
        : d.notifications.beforeStartMinutes,
      beforeEndMinutes: Array.isArray(notif.beforeEndMinutes)
        ? (notif.beforeEndMinutes as number[]).filter(
            (n) => typeof n === "number",
          )
        : d.notifications.beforeEndMinutes,
    },
  };
}

export function loadSettings(): AppSettings {
  if (typeof localStorage === "undefined") return { ...DEFAULT_SETTINGS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS, language: detectLanguage() };
    return coerceSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Quota or private-mode failures are non-fatal; app still works in-memory.
  }
}

export function clearSettings(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function hasCompletedOnboarding(settings: AppSettings): boolean {
  return Boolean(settings.location);
}

/** Stable anonymous id for future push-subscription association. */
export function getUserId(): string {
  if (typeof localStorage === "undefined") return "anonymous";
  try {
    let id = localStorage.getItem(USER_ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(USER_ID_KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}
