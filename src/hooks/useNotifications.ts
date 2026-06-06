import * as React from "react";
import type { Language, PrayerWindow } from "@/types";
import {
  computeReminders,
  initNotificationProvider,
  isPushProvider,
  syncReminders,
} from "@/lib/notifications/scheduler";
import type { NotificationProvider } from "@/lib/notifications/providers";
import type { SubscribeResult } from "@/lib/notifications/pushNotificationProvider";
import { getServiceWorkerRegistration } from "@/lib/pwa/serviceWorkerRegistration";
import { getMessages } from "@/lib/i18n/messages";
import { useSettings } from "@/app/SettingsContext";

const WELCOME_TAG = "waqt-enabled";
const WELCOME_KEY = "waqt.welcomeShownAt.v1";
/** Min gap between confirmation pings so rapid on/off toggling can't spam. */
const WELCOME_COOLDOWN_MS = 60_000;

/**
 * Best-effort "notifications on" confirmation, shown once per enable.
 * Guarded by a localStorage cooldown + a shared tag (the OS collapses repeats),
 * so toggling off/on in a loop never produces a stream of banners.
 */
async function showEnabledNotification(lang: Language): Promise<void> {
  if (
    typeof Notification === "undefined" ||
    Notification.permission !== "granted"
  ) {
    return;
  }
  try {
    const last = Number(localStorage.getItem(WELCOME_KEY) ?? "0");
    if (Date.now() - last < WELCOME_COOLDOWN_MS) return;
    localStorage.setItem(WELCOME_KEY, String(Date.now()));
  } catch {
    // localStorage unavailable — still show, the tag prevents stacking
  }

  const m = getMessages(lang).notif;
  try {
    const reg = await getServiceWorkerRegistration();
    await reg.showNotification(m.enabledTitle, {
      body: m.enabledBody,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      tag: WELCOME_TAG,
    });
  } catch {
    try {
      new Notification(m.enabledTitle, { body: m.enabledBody, tag: WELCOME_TAG });
    } catch {
      // confirmation is best-effort — ignore
    }
  }
}

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
  const [pushError, setPushError] = React.useState<string | null>(null);

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
    setPushError(null);
    const granted = await provider.requestPermission();
    setPermission(provider.getPermission());
    return granted;
  }, [provider]);

  /** Run push subscribe in the click handler (browser requires user gesture). */
  const setPushEnabled = React.useCallback(
    (enabled: boolean): Promise<boolean> => {
      setPushError(null);
      if (!enabled) {
        setNotifications({ enabled: false });
        return Promise.resolve(true);
      }
      if (!provider) return Promise.resolve(false);

      const finish = (result: SubscribeResult): boolean => {
        if (!result.ok) {
          setPushError(result.reason);
          return false;
        }
        setNotifications({ enabled: true });
        void showEnabledNotification(settings.language);
        return true;
      };

      if (permission !== "granted") {
        return requestPermission().then((granted) => {
          if (!granted) {
            setPushError("Izin notifikasi ditolak di browser.");
            return false;
          }
          if (!isPushProvider(provider)) {
            setNotifications({ enabled: true });
            void showEnabledNotification(settings.language);
            return true;
          }
          return provider.ensureSubscription().then(finish);
        });
      }

      if (isPushProvider(provider)) {
        return provider.ensureSubscription().then(finish);
      }

      setNotifications({ enabled: true });
      void showEnabledNotification(settings.language);
      return Promise.resolve(true);
    },
    [provider, permission, requestPermission, setNotifications, settings.language],
  );

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
    pushError,
    requestPermission,
    setPushEnabled,
    setNotifications,
  };
}
