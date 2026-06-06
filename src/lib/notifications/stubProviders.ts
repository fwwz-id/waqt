import type {
  NotificationProvider,
  ScheduleReminderInput,
} from "./providers";

/**
 * Level 3 (future): Capacitor `@capacitor/local-notifications`. Stubbed so the
 * app can detect a native shell later and route through OS-level scheduling.
 */
export class CapacitorNotificationProvider implements NotificationProvider {
  readonly id = "capacitor" as const;

  isSupported(): boolean {
    return false;
  }

  getPermission(): NotificationPermission | "unsupported" {
    return "unsupported";
  }

  async requestPermission(): Promise<boolean> {
    return false;
  }

  async scheduleReminder(_input: ScheduleReminderInput): Promise<void> {}
  async cancelReminder(_id: string): Promise<void> {}
  async cancelAll(): Promise<void> {}
}
