import {
  fetchPushConfig,
  getPushApiUrl,
  registerPushSubscription,
  unregisterPushSubscription,
  type PushSubscriptionJSON,
} from "./pushApi";
import { getServiceWorkerRegistration } from "@/lib/pwa/serviceWorkerRegistration";
import type { NotificationProvider } from "./providers";

/** Result of a subscribe attempt — carries the reason on failure for the UI. */
export type SubscribeResult = { ok: true } | { ok: false; reason: string };

/** Turn a raw subscribe error into a plain, user-friendly reason. */
function describeSubscribeError(err: unknown): string {
  const name = err instanceof Error ? err.name : "";
  const message = err instanceof Error ? err.message : "";
  // Brave (and some Firefox/Safari setups) block the push service by default,
  // surfacing as "Registration failed - push service error" / AbortError.
  if (
    name === "AbortError" ||
    /push service|registration failed/i.test(message)
  ) {
    return "Browser ini memblokir notifikasi push. Aktifkan layanan push di pengaturan browser, lalu coba lagi. Browser lain seperti Chrome biasanya langsung bisa.";
  }
  if (name === "NotAllowedError") {
    return "Izin notifikasi belum diberikan untuk situs ini.";
  }
  return message ? `Gagal subscribe: ${message}` : "Gagal subscribe ke layanan push.";
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function subscriptionToJson(sub: PushSubscription): PushSubscriptionJSON {
  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    throw new Error("Invalid push subscription");
  }
  return {
    endpoint: json.endpoint,
    keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
  };
}

/**
 * Level 2 provider: Cloudflare Worker + Web Push (VAPID).
 * Scheduling is server-side; this class handles permission + subscription only.
 */
export class PushNotificationProvider implements NotificationProvider {
  readonly id = "push" as const;
  readonly apiUrl: string;

  private vapidPublicKey: string;
  private subscription: PushSubscription | null = null;

  constructor(apiUrl: string, vapidPublicKey: string) {
    this.apiUrl = apiUrl.replace(/\/$/, "");
    this.vapidPublicKey = vapidPublicKey;
  }

  static async create(apiUrl: string): Promise<PushNotificationProvider | null> {
    const config = await fetchPushConfig(apiUrl);
    if (!config) return null;
    return new PushNotificationProvider(apiUrl, config.vapidPublicKey);
  }

  isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      typeof Notification !== "undefined"
    );
  }

  getPermission(): NotificationPermission | "unsupported" {
    if (!this.isSupported()) return "unsupported";
    return Notification.permission;
  }

  /** Notification permission only — subscribe on the switch toggle (needs user gesture). */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    if (Notification.permission === "denied") return false;
    if (Notification.permission === "granted") return true;
    const result = await Notification.requestPermission();
    return result === "granted";
  }

  /** Subscribe (if needed) and register with the Worker backend. */
  ensureSubscription(): Promise<SubscribeResult> {
    if (!this.isSupported()) {
      return Promise.resolve({
        ok: false,
        reason: "Browser tidak mendukung notifikasi push.",
      });
    }
    if (Notification.permission !== "granted") {
      return Promise.resolve({
        ok: false,
        reason: "Izin notifikasi belum diberikan.",
      });
    }

    return this.runEnsureSubscription().catch((err) => {
      console.error("[waqt] push subscribe failed", err);
      return { ok: false as const, reason: describeSubscribeError(err) };
    });
  }

  private async runEnsureSubscription(): Promise<SubscribeResult> {
    const registration = await getServiceWorkerRegistration();
    let sub = await registration.pushManager.getSubscription();

    if (sub) {
      const existing = await registerPushSubscription(
        this.apiUrl,
        subscriptionToJson(sub),
      );
      if (existing.ok) {
        this.subscription = sub;
        return { ok: true };
      }
      await sub.unsubscribe().catch(() => {});
      sub = null;
    }

    sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        this.vapidPublicKey,
      ) as BufferSource,
    });

    this.subscription = sub;
    const registered = await registerPushSubscription(
      this.apiUrl,
      subscriptionToJson(sub),
    );
    if (registered.ok) {
      this.subscription = sub;
      return { ok: true };
    }
    return {
      ok: false,
      reason: `Server menolak subscription: ${registered.error ?? "tidak diketahui"}`,
    };
  }

  /** Sync an existing browser subscription to the Worker (no PushManager.subscribe). */
  async syncSubscriptionToServer(): Promise<boolean> {
    if (!this.isSupported() || Notification.permission !== "granted") {
      return false;
    }

    try {
      const registration = await getServiceWorkerRegistration();
      const sub = await registration.pushManager.getSubscription();
      if (!sub) return false;

      const registered = await registerPushSubscription(
        this.apiUrl,
        subscriptionToJson(sub),
      );
      if (registered.ok) {
        this.subscription = sub;
        return true;
      }
      return false;
    } catch (err) {
      console.error("[waqt] push sync failed", err);
      return false;
    }
  }

  async unsubscribe(): Promise<void> {
    if (!this.isSupported()) return;
    const registration = await getServiceWorkerRegistration();
    const sub =
      this.subscription ?? (await registration.pushManager.getSubscription());
    if (!sub) return;

    await unregisterPushSubscription(this.apiUrl, sub.endpoint);
    await sub.unsubscribe();
    this.subscription = null;
  }

  async scheduleReminder(): Promise<void> {
    /* server-owned */
  }

  async cancelReminder(): Promise<void> {
    /* server-owned */
  }

  async cancelAll(): Promise<void> {
    /* server-owned */
  }
}

let initPromise: Promise<NotificationProvider> | null = null;

export async function createPushProviderIfConfigured(): Promise<NotificationProvider | null> {
  const apiUrl = getPushApiUrl();
  if (!apiUrl) return null;
  return PushNotificationProvider.create(apiUrl);
}

export function resetPushProviderInit(): void {
  initPromise = null;
}

export async function initNotificationProvider(): Promise<NotificationProvider> {
  if (!initPromise) {
    initPromise = (async () => {
      const push = await createPushProviderIfConfigured();
      if (push) return push;
      const { getWebNotificationProvider } = await import("./webNotificationProvider");
      return getWebNotificationProvider();
    })();
  }
  return initPromise;
}
