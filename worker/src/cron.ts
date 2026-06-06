import type { Env, SubscriptionRow } from "./types";
import { dueAndNext, type StoredSettings } from "./schedule";
import { sendPush } from "./push";

const CRON_WINDOW_MS = 5 * 60_000; // matches the */5 trigger cadence

type DueRow = StoredSettings & { user_id: string };

/**
 * Cron handler (runs every 5 minutes):
 *  1. Select only users whose next_notification_at is due (indexed query —
 *     never a full table scan).
 *  2. For each, compute due reminders and the next reminder time.
 *  3. Push due reminders to all of the user's subscriptions.
 *  4. Store next_notification_at so the next tick recomputes precisely.
 */
export async function runCron(env: Env): Promise<void> {
  const now = Date.now();

  const due = await env.DB.prepare(
    `SELECT user_id, lat, lng, madhhab, calculation_method, country_code,
            at_start, before_start_minutes, before_end_minutes
     FROM user_settings
     WHERE notification_enabled = 1
       AND next_notification_at IS NOT NULL
       AND next_notification_at <= ?
     LIMIT 500`,
  )
    .bind(now)
    .all<DueRow>();

  for (const row of due.results ?? []) {
    const { due: reminders, nextAt } = dueAndNext(row, now, CRON_WINDOW_MS);

    if (reminders.length > 0) {
      const subs = await env.DB.prepare(
        `SELECT id, user_id, endpoint, p256dh, auth FROM subscriptions WHERE user_id = ?`,
      )
        .bind(row.user_id)
        .all<SubscriptionRow>();

      // Send the most relevant (latest) due reminder to each subscription.
      const reminder = reminders[reminders.length - 1];
      await Promise.all(
        (subs.results ?? []).map(async (sub) => {
          try {
            const result = await sendPush(env, { ...sub }, {
              title: reminder.title,
              body: reminder.body,
              prayer: reminder.prayer,
              tag: `${reminder.prayer}:${reminder.fireAt}`,
            });
            if (result.gone) {
              await env.DB.prepare(
                `DELETE FROM subscriptions WHERE id = ?`,
              )
                .bind(sub.id)
                .run();
            }
          } catch {
            /* transient push failure — retried next tick */
          }
        }),
      );
    }

    // Advance the pointer. If no further reminders today, check again at the
    // next local midnight-ish boundary (now + ~6h floor) so we recompute.
    const nextNotificationAt = nextAt ?? now + 6 * 60 * 60_000;
    await env.DB.prepare(
      `UPDATE user_settings SET next_notification_at = ?, updated_at = ? WHERE user_id = ?`,
    )
      .bind(nextNotificationAt, now, row.user_id)
      .run();
  }
}
