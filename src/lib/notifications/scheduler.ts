import type { Language, NotificationSettings, PrayerWindow } from "@/types";
import { getMessages } from "@/lib/i18n/messages";
import type {
  NotificationProvider,
  ScheduleReminderInput,
} from "./providers";
import { syncPushSettings } from "./pushApi";
import {
  initNotificationProvider,
  PushNotificationProvider,
} from "./pushNotificationProvider";
import { getWebNotificationProvider } from "./webNotificationProvider";
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

/** Sync fallback before async init completes. */
export function getNotificationProvider(): NotificationProvider {
  return getWebNotificationProvider();
}

export { initNotificationProvider };

export function isPushProvider(
  provider: NotificationProvider,
): provider is PushNotificationProvider {
  return provider.id === "push";
}

/**
 * Reconcile scheduled reminders with the desired set.
 * - Web provider: local setTimeout while the app is alive.
 * - Push provider: sync settings to the Worker; cron delivers in background.
 */
export async function syncReminders(
  windows: PrayerWindow[],
  settings: NotificationSettings,
  now: Date = new Date(),
  lang: Language = "id",
  provider: NotificationProvider = getNotificationProvider(),
  appSettings?: Parameters<typeof syncPushSettings>[1],
): Promise<number> {
  const web = getWebNotificationProvider();
  await web.cancelAll();

  if (!settings.enabled) {
    if (isPushProvider(provider) && appSettings) {
      await syncPushSettings(provider.apiUrl, {
        ...appSettings,
        notifications: { ...settings, enabled: false },
      });
    }
    return 0;
  }

  if (provider.getPermission() !== "granted") return 0;

  const reminders = computeReminders(windows, settings, now, lang);

  if (isPushProvider(provider)) {
    if (!appSettings?.location) return 0;
    const subscribed = await provider.ensureSubscription();
    if (!subscribed) return 0;
    const ok = await syncPushSettings(provider.apiUrl, appSettings);
    return ok ? reminders.length : 0;
  }

  await Promise.all(reminders.map((r) => provider.scheduleReminder(r)));
  return reminders.length;
}
