import type { Env } from "./types";
import { handleSubscriptions } from "./routes/subscriptions";
import { handleSettings } from "./routes/settings";
import { handleTestPush } from "./routes/testPush";
import { runCron } from "./cron";

function cors(env: Env, req?: Request): Record<string, string> {
  const allowed = (env.ALLOWED_ORIGIN || "*")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const origin = req?.headers.get("Origin") ?? "";
  const match =
    allowed.includes("*") || allowed.includes(origin)
      ? origin || allowed[0] || "*"
      : allowed[0] || "*";

  return {
    "Access-Control-Allow-Origin": match,
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

export function json(
  data: unknown,
  init: ResponseInit = {},
  env?: Env,
  req?: Request,
) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(env ? cors(env, req) : {}),
      ...(init.headers ?? {}),
    },
  });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(env, req) });
    }

    // Expose the public VAPID key so the frontend can subscribe.
    if (url.pathname === "/api/config" && req.method === "GET") {
      return json({ vapidPublicKey: env.VAPID_PUBLIC_KEY }, {}, env, req);
    }

    if (url.pathname.startsWith("/api/subscriptions")) {
      return handleSubscriptions(req, env);
    }
    if (url.pathname.startsWith("/api/settings")) {
      return handleSettings(req, env);
    }
    if (url.pathname === "/api/test-push") {
      return handleTestPush(req, env);
    }

    return json({ error: "Not found" }, { status: 404 }, env, req);
  },

  // Cloudflare Cron Trigger entrypoint (every 5 minutes per wrangler.toml).
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runCron(env));
  },
};
