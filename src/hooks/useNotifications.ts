import * as React from "react";
import type { PrayerWindow } from "@/types";
import {
  computeReminders,
  initNotificationProvider,
  isPushProvider,
  syncReminders,
} from "@/lib/notifications/scheduler";
import type { NotificationProvider } from "@/lib/notifications/providers";
import { useSettings } from "@/app/SettingsContext";

export type NotificationPermissionState =
  | NotificationPermission
  | "unsupported";

export function useNotifications(windows: PrayerWindow[]) {
  const { settings, setNotifications } = useSettings();
  const [provider, setProvider] = React.useState<NotificationProvider | null>(
    null,
  );
  const [permission, setPermission] =
    React.useState<NotificationPermissionState>("default");
  const [scheduledCount, setScheduledCount] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    initNotificationProvider().then((p) => {
      if (!cancelled) {
        setProvider(p);
        setPermission(p.getPermission());
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const supported = provider?.isSupported() ?? false;
  const notif = settings.notifications;
  const usesPush = provider ? isPushProvider(provider) : false;

  const requestPermission = React.useCallback(async () => {
    if (!provider) return false;
    const granted = await provider.requestPermission();
    setPermission(provider.getPermission());
    if (granted) setNotifications({ enabled: true });
    return granted;
  }, [provider, setNotifications]);

  React.useEffect(() => {
    if (!provider) return;

    let cancelled = false;

    if (!notif.enabled || permission !== "granted" || windows.length === 0) {
      syncReminders(
        windows,
        { ...notif, enabled: false },
        new Date(),
        settings.language,
        provider,
        settings,
      ).then(() => {
        if (!cancelled) setScheduledCount(0);
      });
      return () => {
        cancelled = true;
      };
    }

    syncReminders(
      windows,
      notif,
      new Date(),
      settings.language,
      provider,
      settings,
    ).then((count) => {
      if (!cancelled) setScheduledCount(count);
    });

    return () => {
      cancelled = true;
    };
  }, [provider, windows, notif, permission, settings]);

  const upcomingCount = React.useMemo(() => {
    if (!notif.enabled) return 0;
    return computeReminders(windows, notif, new Date(), settings.language)
      .length;
  }, [windows, notif, settings.language]);

  return {
    supported,
    permission,
    enabled: notif.enabled,
    scheduledCount: usesPush ? upcomingCount : scheduledCount,
    usesPush,
    requestPermission,
    setNotifications,
  };
}
