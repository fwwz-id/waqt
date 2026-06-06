import {
  fetchPushConfig,
  getPushApiUrl,
  registerPushSubscription,
  unregisterPushSubscription,
  type PushSubscriptionJSON,
} from "./pushApi";
import type { NotificationProvider } from "./providers";

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

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    if (Notification.permission === "denied") return false;
    if (Notification.permission !== "granted") {
      const result = await Notification.requestPermission();
      if (result !== "granted") return false;
    }
    return this.ensureSubscription();
  }

  /** Subscribe (if needed) and register with the Worker backend. */
  async ensureSubscription(): Promise<boolean> {
    if (!this.isSupported() || Notification.permission !== "granted") {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    let sub = await registration.pushManager.getSubscription();

    if (!sub) {
      sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          this.vapidPublicKey,
        ) as BufferSource,
      });
    }

    this.subscription = sub;
    return registerPushSubscription(this.apiUrl, subscriptionToJson(sub));
  }

  async unsubscribe(): Promise<void> {
    if (!this.isSupported()) return;
    const registration = await navigator.serviceWorker.ready;
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
