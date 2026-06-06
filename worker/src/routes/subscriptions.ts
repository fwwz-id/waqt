import type { Env, PushSubscriptionJSON } from "../types";
import { json } from "../index";

/**
 * POST   /api/subscriptions  — upsert a push subscription for a user.
 * DELETE /api/subscriptions  — remove a subscription by endpoint.
 *
 * Body (POST): { userId: string, subscription: PushSubscriptionJSON }
 * Body (DELETE): { endpoint: string }
 */
export async function handleSubscriptions(
  req: Request,
  env: Env,
): Promise<Response> {
  const now = Date.now();

  if (req.method === "POST") {
    const body = (await req.json().catch(() => null)) as {
      userId?: string;
      subscription?: PushSubscriptionJSON;
    } | null;

    if (!body?.userId || !body.subscription?.endpoint) {
      return json({ error: "Invalid payload" }, { status: 400 }, env);
    }
    const { userId, subscription } = body;

    await env.DB.prepare(
      `INSERT INTO users (id, created_at, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET updated_at = excluded.updated_at`,
    )
      .bind(userId, now, now)
      .run();

    const id = `${userId}:${await shortHash(subscription.endpoint)}`;
    await env.DB.prepare(
      `INSERT INTO subscriptions (id, user_id, endpoint, p256dh, auth, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(endpoint) DO UPDATE SET
         user_id = excluded.user_id,
         p256dh = excluded.p256dh,
         auth = excluded.auth,
         updated_at = excluded.updated_at`,
    )
      .bind(
        id,
        userId,
        subscription.endpoint,
        subscription.keys.p256dh,
        subscription.keys.auth,
        now,
        now,
      )
      .run();

    return json({ ok: true, id }, { status: 201 }, env);
  }

  if (req.method === "DELETE") {
    const body = (await req.json().catch(() => null)) as {
      endpoint?: string;
    } | null;
    if (!body?.endpoint) {
      return json({ error: "Missing endpoint" }, { status: 400 }, env);
    }
    await env.DB.prepare(`DELETE FROM subscriptions WHERE endpoint = ?`)
      .bind(body.endpoint)
      .run();
    return json({ ok: true }, {}, env);
  }

  return json({ error: "Method not allowed" }, { status: 405 }, env);
}

async function shortHash(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)]
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
