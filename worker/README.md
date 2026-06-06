# Waqt Push Backend (Cloudflare Worker)

Level 2 of the notification architecture: reliable Web Push even when the PWA
is closed. The frontend works fully without this — it only adds server-driven
reminders.

## Stack
- **Workers** — HTTP API + cron handler
- **D1** — `users`, `subscriptions`, `user_settings` (see `schema.sql`)
- **Cron Triggers** — every 5 minutes (`*/5 * * * *`)
- **Web Push (VAPID)** — `src/push.ts`

## Setup

```bash
cd worker
bun install            # or npm install

# 1. Generate VAPID keys
bun run vapid
#   -> copy VAPID_PUBLIC_KEY into wrangler.toml [vars]
#   -> wrangler secret put VAPID_PRIVATE_KEY   (paste the private d value)

# 2. Create D1 and apply schema
wrangler d1 create waqt          # paste database_id into wrangler.toml
bun run db:init:remote

# 3. Configure
cp wrangler.toml.example wrangler.toml   # fill in IDs + ALLOWED_ORIGIN

# 4. Run / deploy
bun run dev
bun run deploy
```

## API

| Method | Path                  | Body                                            |
|--------|-----------------------|-------------------------------------------------|
| GET    | `/api/config`         | → `{ vapidPublicKey }`                           |
| POST   | `/api/subscriptions`  | `{ userId, subscription: PushSubscriptionJSON }` |
| DELETE | `/api/subscriptions`  | `{ endpoint }`                                   |
| POST   | `/api/settings`       | `UserSettingsPayload`                            |

## Cron flow

1. Indexed query selects only users with `next_notification_at <= now` — never a
   full scan.
2. `src/schedule.ts` recomputes today's reminders with adhan.
3. Due reminders are pushed to every subscription; `410/404` subscriptions are
   pruned.
4. `next_notification_at` is advanced to the next reminder instant.

## Notes
- `src/push.ts` sends an encrypted JSON payload (RFC 8291 aes128gcm); the
  service worker parses it in the `push` handler.
- For full parity with the advanced fiqh end-time rules, promote
  `../src/lib/prayer/*` into a shared workspace package and import it here
  instead of the simplified `schedule.ts` end map.
