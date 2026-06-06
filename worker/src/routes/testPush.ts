import type { Env, SubscriptionRow } from "../types";
import { json } from "../index";
import { sendPush } from "../push";

type TestPushBody = {
  title?: string;
  body?: string;
  userId?: string;
};

/**
 * /api/test-push — manual testing helpers, protected by TEST_PUSH_SECRET.
 *
 *   GET  → list registered subscriptions (who/where/when) so you can confirm
 *          the device toggle actually saved a row, and under which userId.
 *   POST → send a one-off push to registered device(s).
 *          Body: { title?, body, userId? } — omit userId to fan out to all.
 *
 * Used by `bun run notification` (POST) and `bun run notification --list` (GET).
 */
export async function handleTestPush(
  req: Request,
  env: Env,
): Promise<Response> {
  if (req.method !== "POST" && req.method !== "GET") {
    return json({ error: "Method not allowed" }, { status: 405 }, env, req);
  }

  if (!env.TEST_PUSH_SECRET) {
    return json(
      { error: "Test push not configured (set TEST_PUSH_SECRET secret)" },
      { status: 503 },
      env,
      req,
    );
  }

  const auth = req.headers.get("Authorization");
  if (auth !== `Bearer ${env.TEST_PUSH_SECRET}`) {
    return json({ error: "Unauthorized" }, { status: 401 }, env, req);
  }

  if (req.method === "GET") {
    return listSubscriptions(env, req);
  }

  const input = (await req.json().catch(() => null)) as TestPushBody | null;
  if (!input?.body?.trim()) {
    return json({ error: "Missing body" }, { status: 400 }, env, req);
  }

  const title = input.title?.trim() || "Waqt";
  const body = input.body.trim();
  const userId = input.userId?.trim();

  const subs = userId
    ? await env.DB.prepare(
        `SELECT id, user_id, endpoint, p256dh, auth FROM subscriptions WHERE user_id = ?`,
      )
        .bind(userId)
        .all<SubscriptionRow>()
    : await env.DB.prepare(
        `SELECT id, user_id, endpoint, p256dh, auth FROM subscriptions`,
      ).all<SubscriptionRow>();

  const rows = subs.results ?? [];
  if (rows.length === 0) {
    return json(
      {
        error: userId
          ? `No subscriptions for userId ${userId}`
          : "No push subscriptions registered yet — enable notifications in the app first",
      },
      { status: 404 },
      env,
      req,
    );
  }

  const results: Array<{
    subscriptionId: string;
    userId: string;
    ok: boolean;
    status: number;
    gone: boolean;
    error?: string;
  }> = [];

  for (const sub of rows) {
    try {
      const result = await sendPush(env, sub, {
        title,
        body,
        tag: "waqt-test",
      });
      if (result.gone) {
        await env.DB.prepare(`DELETE FROM subscriptions WHERE id = ?`)
          .bind(sub.id)
          .run();
      }
      results.push({
        subscriptionId: sub.id,
        userId: sub.user_id,
        ok: result.ok,
        status: result.status,
        gone: result.gone,
      });
    } catch (err) {
      results.push({
        subscriptionId: sub.id,
        userId: sub.user_id,
        ok: false,
        status: 0,
        gone: false,
        error: err instanceof Error ? err.message : "send failed",
      });
    }
  }

  const sent = results.filter((r) => r.ok).length;
  return json(
    {
      ok: sent > 0,
      sent,
      total: results.length,
      title,
      body,
      results,
    },
    { status: sent > 0 ? 200 : 502 },
    env,
    req,
  );
}

type SubscriptionListRow = {
  id: string;
  user_id: string;
  endpoint: string;
  created_at: number;
  updated_at: number;
};

/** GET /api/test-push — list every registered subscription for diagnostics. */
async function listSubscriptions(env: Env, req: Request): Promise<Response> {
  const { results } = await env.DB.prepare(
    `SELECT id, user_id, endpoint, created_at, updated_at
       FROM subscriptions
   ORDER BY updated_at DESC`,
  ).all<SubscriptionListRow>();

  const rows = results ?? [];
  const subscriptions = rows.map((r) => ({
    userId: r.user_id,
    host: hostOf(r.endpoint),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  return json(
    { total: subscriptions.length, subscriptions },
    {},
    env,
    req,
  );
}

function hostOf(endpoint: string): string {
  try {
    return new URL(endpoint).host;
  } catch {
    return "unknown";
  }
}
