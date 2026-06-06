#!/usr/bin/env bun
/**
 * Send a test Web Push through the Waqt Worker.
 *
 * Setup (once):
 *   cd worker && wrangler secret put TEST_PUSH_SECRET
 *   echo 'TEST_PUSH_SECRET=your-secret' >> ../.env
 *
 * Usage:
 *   bun run notification --list                       # show registered devices
 *   bun run notification "Assalamualaikum"            # push to every device
 *   bun run notification --title "Tes" "Assalamualaikum"
 *   bun run notification --user-id <uuid> "Halo"      # push to one device
 */

const DEFAULT_API = "https://waqt-push.fwwz-id.workers.dev";

function usage(): never {
  console.log(`Usage:
  bun run notification --list                          # list registered devices
  bun run notification [--title "Judul"] [--user-id UUID] "Pesan"

Environment (.env in repo root):
  PUSH_API_URL      Worker base URL (default: ${DEFAULT_API})
  TEST_PUSH_SECRET  Must match wrangler secret on the Worker

Run --list first to confirm a device subscription exists (and its userId).
Enable notifications in the app once so a subscription is saved to D1.`);
  process.exit(1);
}

const args = process.argv.slice(2);
if (args.includes("-h") || args.includes("--help")) {
  usage();
}

const listOnly = args.includes("--list");

let title = "Waqt";
let userId: string | undefined;
const bodyParts: string[] = [];

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === "--list") continue;
  if (arg === "--title" || arg === "-t") {
    title = args[++i] ?? title;
    continue;
  }
  if (arg.startsWith("--user-id=")) {
    userId = arg.slice("--user-id=".length);
    continue;
  }
  if (arg === "--user-id") {
    userId = args[++i];
    continue;
  }
  bodyParts.push(arg);
}

const body = bodyParts.join(" ").trim();
if (!listOnly && !body) usage();

const apiUrl = (
  process.env.PUSH_API_URL ??
  process.env.VITE_PUSH_API_URL ??
  DEFAULT_API
).replace(/\/$/, "");

const secret = process.env.TEST_PUSH_SECRET;
if (!secret) {
  console.error(
    "Missing TEST_PUSH_SECRET. Add it to .env and set the same value on the Worker:\n  cd worker && wrangler secret put TEST_PUSH_SECRET",
  );
  process.exit(1);
}

if (listOnly) {
  const res = await fetch(`${apiUrl}/api/test-push`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const data = (await res.json().catch(() => ({}))) as {
    error?: string;
    total?: number;
    subscriptions?: Array<{
      userId: string;
      host: string;
      createdAt: number;
      updatedAt: number;
    }>;
  };
  if (!res.ok) {
    console.error(data.error ?? `Request failed (${res.status})`);
    process.exit(1);
  }
  const subs = data.subscriptions ?? [];
  if (subs.length === 0) {
    console.log(
      "No subscriptions registered yet.\n\n" +
        "Open the app, go to Settings, and toggle notifications ON (grant the\n" +
        "browser permission). That saves this device's subscription to D1.\n" +
        "Then run `bun run notification --list` again to confirm.",
    );
    process.exit(0);
  }
  console.log(`${subs.length} subscription(s) registered:\n`);
  for (const s of subs) {
    const when = new Date(s.updatedAt).toISOString().replace("T", " ").slice(0, 16);
    console.log(`  userId: ${s.userId}`);
    console.log(`    via:  ${s.host}   updated: ${when}`);
  }
  console.log(
    `\nSend to all:   bun run notification "Assalamualaikum"` +
      `\nSend to one:   bun run notification --user-id ${subs[0].userId} "Halo"`,
  );
  process.exit(0);
}

const res = await fetch(`${apiUrl}/api/test-push`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${secret}`,
  },
  body: JSON.stringify({ title, body, userId }),
});

const data = (await res.json().catch(() => ({}))) as {
  error?: string;
  sent?: number;
  total?: number;
  results?: Array<{
    ok: boolean;
    status: number;
    userId: string;
    error?: string;
  }>;
};

if (!res.ok) {
  console.error(data.error ?? `Request failed (${res.status})`);
  if (data.results?.length) {
    for (const r of data.results) {
      const detail =
        r.status > 0
          ? `HTTP ${r.status}`
          : (r.error ?? "invalid subscription or VAPID keys");
      console.error(`  user ${r.userId}: ${detail}`);
    }
  }
  if (res.status === 404) {
    console.error(
      "\nEnable notifications in the app (Settings → toggle ON) so a real device subscription is saved to D1.",
    );
  }
  process.exit(1);
}

console.log(`Push sent to ${data.sent}/${data.total} subscription(s).`);
console.log(`  title: ${title}`);
console.log(`  body:  ${body}`);
