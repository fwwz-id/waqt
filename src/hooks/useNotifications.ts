import * as React from "react";
import type { PrayerWindow } from "@/types";
import {
  getNotificationProvider,
  syncReminders,
} from "@/lib/notifications/scheduler";
import { useSettings } from "@/app/SettingsContext";

export type NotificationPermissionState =
  | NotificationPermission
  | "unsupported";

export function useNotifications(windows: PrayerWindow[]) {
  const { settings, setNotifications } = useSettings();
  const provider = getNotificationProvider();
  const [permission, setPermission] =
    React.useState<NotificationPermissionState>(() =>
      provider.getPermission(),
    );
  const [scheduledCount, setScheduledCount] = React.useState(0);

  const supported = provider.isSupported();
  const notif = settings.notifications;

  const requestPermission = React.useCallback(async () => {
    const granted = await provider.requestPermission();
    setPermission(provider.getPermission());
    if (granted) setNotifications({ enabled: true });
    return granted;
  }, [provider, setNotifications]);

  // Reconcile scheduled reminders whenever windows or prefs change.
  React.useEffect(() => {
    let cancelled = false;
    if (!notif.enabled || permission !== "granted" || windows.length === 0) {
      provider.cancelAll();
      setScheduledCount(0);
      return;
    }
    syncReminders(windows, notif, new Date(), settings.language).then(
      (count) => {
        if (!cancelled) setScheduledCount(count);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [provider, windows, notif, permission, settings.language]);

  return {
    supported,
    permission,
    enabled: notif.enabled,
    scheduledCount,
    requestPermission,
    setNotifications,
  };
}
