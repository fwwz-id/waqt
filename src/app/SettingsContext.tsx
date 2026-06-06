import * as React from "react";
import type {
  AppSettings,
  CalculationMethod,
  Language,
  LocationConfig,
  Madhhab,
  NotificationSettings,
  PrayerName,
  RuleId,
} from "@/types";
import {
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
} from "@/lib/storage/settingsStorage";

type SettingsContextValue = {
  settings: AppSettings;
  /** Whether the user has finished the minimal onboarding (location set). */
  ready: boolean;
  setLocation: (location: LocationConfig) => void;
  setLanguage: (language: Language) => void;
  setMadhhab: (madhhab: Madhhab) => void;
  setCalculationMethod: (method: CalculationMethod) => void;
  setAdvancedMode: (on: boolean) => void;
  setHeuristic: (key: keyof AppSettings["heuristicSettings"], value: number) => void;
  setCustomRule: (prayer: PrayerName, ruleId: RuleId | null) => void;
  setNotifications: (patch: Partial<NotificationSettings>) => void;
  resetAll: () => void;
  update: (patch: Partial<AppSettings>) => void;
};

const SettingsContext = React.createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = React.useState<AppSettings>(() =>
    loadSettings(),
  );

  // Persist on every change.
  React.useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // Keep the document language in sync for accessibility / hyphenation.
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = settings.language;
    }
  }, [settings.language]);

  const update = React.useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = React.useMemo<SettingsContextValue>(
    () => ({
      settings,
      ready: Boolean(settings.location),
      update,
      setLocation: (location) => update({ location }),
      setLanguage: (language) => update({ language }),
      setMadhhab: (madhhab) => update({ madhhab }),
      setCalculationMethod: (calculationMethod) =>
        update({ calculationMethod }),
      setAdvancedMode: (advancedMode) => update({ advancedMode }),
      setHeuristic: (key, value) =>
        setSettings((prev) => ({
          ...prev,
          heuristicSettings: { ...prev.heuristicSettings, [key]: value },
        })),
      setCustomRule: (prayer, ruleId) =>
        setSettings((prev) => {
          const next = { ...(prev.customRules ?? {}) };
          if (ruleId === null) delete next[prayer];
          else next[prayer] = ruleId;
          return { ...prev, customRules: next };
        }),
      setNotifications: (patch) =>
        setSettings((prev) => ({
          ...prev,
          notifications: { ...prev.notifications, ...patch },
        })),
      resetAll: () => setSettings({ ...DEFAULT_SETTINGS }),
    }),
    [settings, update],
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = React.useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return ctx;
}
