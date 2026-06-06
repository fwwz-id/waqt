import type {
  NotificationProvider,
  ScheduleReminderInput,
} from "./providers";

/**
 * Level 1 provider: local, best-effort scheduling using setTimeout while the
 * page (or its controlling service worker) is alive. This is the MVP path.
 *
 * Honest limitation: browsers may suspend timers in background tabs, so this
 * cannot guarantee delivery when the app is closed. Reliable background
 * delivery is the job of the Level 2 Web Push provider.
 */
export class WebNotificationProvider implements NotificationProvider {
  readonly id = "web" as const;
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  isSupported(): boolean {
    return typeof window !== "undefined" && "Notification" in window;
  }

  getPermission(): NotificationPermission | "unsupported" {
    if (!this.isSupported()) return "unsupported";
    return Notification.permission;
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    if (Notification.permission === "granted") return true;
    if (Notification.permission === "denied") return false;
    const result = await Notification.requestPermission();
    return result === "granted";
  }

  async scheduleReminder(input: ScheduleReminderInput): Promise<void> {
    if (!this.isSupported() || Notification.permission !== "granted") return;

    const delay = input.fireAt.getTime() - Date.now();
    // Skip past reminders. Cap the timer horizon — anything beyond ~24h should
    // be re-scheduled on the next app open / midnight recompute anyway, and
    // setTimeout overflows beyond ~24.8 days.
    if (delay <= 0 || delay > 24 * 60 * 60 * 1000) return;

    this.cancelReminder(input.id);
    const timer = setTimeout(() => {
      this.fire(input);
      this.timers.delete(input.id);
    }, delay);
    this.timers.set(input.id, timer);
  }

  private async fire(input: ScheduleReminderInput): Promise<void> {
    try {
      // Prefer the SW registration so the notification persists if the tab is
      // backgrounded; fall back to the page-level Notification constructor.
      const reg = await navigator.serviceWorker?.getRegistration();
      const options: NotificationOptions = {
        body: input.body,
        tag: input.id,
        icon: "/pwa-192x192.png",
        badge: "/pwa-192x192.png",
        data: { prayer: input.prayer, kind: input.kind },
      };
      if (reg) {
        await reg.showNotification(input.title, options);
      } else {
        new Notification(input.title, options);
      }
    } catch {
      /* best-effort */
    }
  }

  async cancelReminder(id: string): Promise<void> {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }

  async cancelAll(): Promise<void> {
    for (const timer of this.timers.values()) clearTimeout(timer);
    this.timers.clear();
  }
}
