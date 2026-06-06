// ---------------------------------------------------------------------------
// Notification provider abstraction.
//
// Three levels are designed for:
//  1. WebNotificationProvider     — local, best-effort while app/SW alive (MVP)
//  2. PushNotificationProvider    — Cloudflare Workers + Web Push (prepared)
//  3. CapacitorNotificationProvider — native local notifications (future)
//
// The UI only ever talks to the NotificationProvider interface so the backing
// implementation can be swapped without touching feature code.
// ---------------------------------------------------------------------------

export type ReminderKind =
  | "start"
  | "before_start"
  | "before_end";

export type ScheduleReminderInput = {
  /** Stable id, e.g. `${prayer}:${kind}:${minutes}:${timestamp}`. */
  id: string;
  title: string;
  body: string;
  /** Absolute time the reminder should fire. */
  fireAt: Date;
  prayer: string;
  kind: ReminderKind;
};

export interface NotificationProvider {
  readonly id: "web" | "push" | "capacitor";
  isSupported(): boolean;
  getPermission(): NotificationPermission | "unsupported";
  requestPermission(): Promise<boolean>;
  scheduleReminder(input: ScheduleReminderInput): Promise<void>;
  cancelReminder(id: string): Promise<void>;
  cancelAll(): Promise<void>;
}
