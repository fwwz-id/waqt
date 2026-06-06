import type {
  NotificationProvider,
  ScheduleReminderInput,
} from "./providers";

/**
 * Level 2 (prepared): Cloudflare Workers + Web Push (VAPID).
 *
 * This stub documents the intended contract. When enabled it would:
 *  - subscribe via `PushManager.subscribe({ applicationServerKey })`
 *  - POST the subscription to the Worker (`/api/subscriptions`)
 *  - let the Worker's cron compute & deliver reminders server-side
 *
 * Local scheduling becomes unnecessary because the server owns delivery, so
 * scheduleReminder/cancel are no-ops here — the source of truth is the synced
 * user settings stored in D1.
 */
export class PushNotificationProvider implements NotificationProvider {
  readonly id = "push" as const;
  /** VAPID public key, supplied when the Worker backend is enabled. */
  constructor(public readonly vapidPublicKey?: string) {}

  isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window
    );
  }

  getPermission(): NotificationPermission | "unsupported" {
    if (typeof Notification === "undefined") return "unsupported";
    return Notification.permission;
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    const result = await Notification.requestPermission();
    return result === "granted";
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async scheduleReminder(_input: ScheduleReminderInput): Promise<void> {
    // No-op: delivery is owned by the Worker cron once subscribed.
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async cancelReminder(_id: string): Promise<void> {}

  async cancelAll(): Promise<void> {}
}

/**
 * Level 3 (future): Capacitor `@capacitor/local-notifications`. Stubbed so the
 * app can detect a native shell later and route through OS-level scheduling.
 */
export class CapacitorNotificationProvider implements NotificationProvider {
  readonly id = "capacitor" as const;

  isSupported(): boolean {
    // Real impl: check `Capacitor.isNativePlatform()`.
    return false;
  }

  getPermission(): NotificationPermission | "unsupported" {
    return "unsupported";
  }

  async requestPermission(): Promise<boolean> {
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async scheduleReminder(_input: ScheduleReminderInput): Promise<void> {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async cancelReminder(_id: string): Promise<void> {}
  async cancelAll(): Promise<void> {}
}
