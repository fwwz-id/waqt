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
| GET    | `/api/test-push`      | → `{ total, subscriptions }` + `Authorization: Bearer <TEST_PUSH_SECRET>` |
| POST   | `/api/test-push`      | `{ title?, body, userId? }` + `Authorization: Bearer <TEST_PUSH_SECRET>` |

### Test push from your machine

```bash
# 1. Set a shared secret on the Worker (once)
cd worker
wrangler secret put TEST_PUSH_SECRET

# 2. Copy .env.example → .env and paste the same secret
# 3. Deploy the Worker, then from repo root:

# Confirm a device is actually registered, and get its userId:
bun run notification --list

# Push to every registered device:
bun run notification "Assalamualaikum"

# Push to one device (copy the userId from --list):
bun run notification --user-id <uuid> "Assalamualaikum"
```

Enable notifications in the app at least once first (Settings → toggle ON, grant
permission) so a subscription is saved to D1. Always run `--list` first — the
userId is generated per browser/device, so guessing it is the usual reason a test
"finds no subscriptions". Dead endpoints return `410 Gone` and are auto-pruned on
the next send or cron run.

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
