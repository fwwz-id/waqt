import type { Language, NotificationSettings, PrayerWindow } from "@/types";
import { getMessages } from "@/lib/i18n/messages";
import type {
  NotificationProvider,
  ScheduleReminderInput,
} from "./providers";
import { WebNotificationProvider } from "./webNotificationProvider";
import { formatDuration } from "@/lib/utils/datetime";

/**
 * Derive the concrete reminders for a day from prayer windows + preferences.
 * Pure function — easy to unit test and reuse by the (future) Worker cron.
 */
export function computeReminders(
  windows: PrayerWindow[],
  settings: NotificationSettings,
  now: Date = new Date(),
  lang: Language = "id",
): ScheduleReminderInput[] {
  if (!settings.enabled) return [];
  const reminders: ScheduleReminderInput[] = [];
  const nowMs = now.getTime();
  const m = getMessages(lang);

  for (const w of windows) {
    const label = m.prayers[w.name];

    if (settings.atStart && w.start.getTime() > nowMs) {
      reminders.push({
        id: `${w.name}:start:0:${w.start.getTime()}`,
        title: m.notifBody.startTitle(label),
        body: m.notifBody.startBody(label, w.endLabel),
        fireAt: w.start,
        prayer: w.name,
        kind: "start",
      });
    }

    for (const mins of settings.beforeStartMinutes) {
      const fireAt = new Date(w.start.getTime() - mins * 60_000);
      if (fireAt.getTime() > nowMs) {
        reminders.push({
          id: `${w.name}:before_start:${mins}:${w.start.getTime()}`,
          title: m.notifBody.beforeStartTitle(label),
          body: m.notifBody.beforeStartBody(mins, label, w.startLabel),
          fireAt,
          prayer: w.name,
          kind: "before_start",
        });
      }
    }

    for (const mins of settings.beforeEndMinutes) {
      const fireAt = new Date(w.end.getTime() - mins * 60_000);
      // Only meaningful if the window has started (or will) and not yet ended.
      if (fireAt.getTime() > nowMs && fireAt.getTime() < w.end.getTime()) {
        reminders.push({
          id: `${w.name}:before_end:${mins}:${w.end.getTime()}`,
          title: m.notifBody.beforeEndTitle(label),
          body: m.notifBody.beforeEndBody(
            mins,
            label,
            w.endLabel,
            formatDuration(w.end.getTime() - nowMs, lang),
          ),
          fireAt,
          prayer: w.name,
          kind: "before_end",
        });
      }
    }
  }

  return reminders.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
}

let providerSingleton: NotificationProvider | null = null;

/** The active provider. MVP always returns the web provider. */
export function getNotificationProvider(): NotificationProvider {
  if (!providerSingleton) {
    providerSingleton = new WebNotificationProvider();
  }
  return providerSingleton;
}

/**
 * Reconcile scheduled reminders with the desired set: cancel everything, then
 * (re)schedule the upcoming reminders. Called whenever windows or settings
 * change. Returns the count actually scheduled.
 */
export async function syncReminders(
  windows: PrayerWindow[],
  settings: NotificationSettings,
  now: Date = new Date(),
  lang: Language = "id",
): Promise<number> {
  const provider = getNotificationProvider();
  await provider.cancelAll();
  if (!settings.enabled) return 0;
  if (provider.getPermission() !== "granted") return 0;

  const reminders = computeReminders(windows, settings, now, lang);
  await Promise.all(reminders.map((r) => provider.scheduleReminder(r)));
  return reminders.length;
}
