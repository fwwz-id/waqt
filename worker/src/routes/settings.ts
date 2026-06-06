import type { Env, UserSettingsPayload } from "../types";
import { json } from "../index";

/**
 * POST /api/settings — upsert a user's notification-relevant settings so the
 * cron can compute prayer times server-side. `next_notification_at` is set to
 * "now" so the next cron tick recomputes the real next reminder for this user.
 */
export async function handleSettings(
  req: Request,
  env: Env,
): Promise<Response> {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 }, env);
  }

  const s = (await req.json().catch(() => null)) as UserSettingsPayload | null;
  if (!s?.userId || typeof s.lat !== "number" || typeof s.lng !== "number") {
    return json({ error: "Invalid payload" }, { status: 400 }, env);
  }

  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO users (id, created_at, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET updated_at = excluded.updated_at`,
  )
    .bind(s.userId, now, now)
    .run();

  await env.DB.prepare(
    `INSERT INTO user_settings (
        user_id, lat, lng, city, country, country_code, timezone,
        madhhab, calculation_method, notification_enabled, at_start,
        before_start_minutes, before_end_minutes, next_notification_at,
        created_at, updated_at
     ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
     ON CONFLICT(user_id) DO UPDATE SET
        lat=excluded.lat, lng=excluded.lng, city=excluded.city,
        country=excluded.country, country_code=excluded.country_code,
        timezone=excluded.timezone, madhhab=excluded.madhhab,
        calculation_method=excluded.calculation_method,
        notification_enabled=excluded.notification_enabled,
        at_start=excluded.at_start,
        before_start_minutes=excluded.before_start_minutes,
        before_end_minutes=excluded.before_end_minutes,
        next_notification_at=excluded.next_notification_at,
        updated_at=excluded.updated_at`,
  )
    .bind(
      s.userId,
      s.lat,
      s.lng,
      s.city ?? null,
      s.country ?? null,
      s.countryCode ?? null,
      s.timezone ?? null,
      s.madhhab,
      s.calculationMethod,
      s.notificationEnabled ? 1 : 0,
      s.atStart ? 1 : 0,
      JSON.stringify(s.beforeStartMinutes ?? []),
      JSON.stringify(s.beforeEndMinutes ?? []),
      s.notificationEnabled ? now : null,
      now,
      now,
    )
    .run();

  return json({ ok: true }, {}, env);
}
