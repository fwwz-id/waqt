import type { Env, SubscriptionRow } from "./types";
import { encryptPushPayload, type PushPayload } from "./pushEncrypt";

/**
 * Web Push (VAPID) sender for Cloudflare Workers using Web Crypto.
 * Delivers an encrypted JSON payload (RFC 8291 aes128gcm) that the service
 * worker parses in its `push` handler.
 */

function b64urlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function bytesToB64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function importVapidKey(env: Env): Promise<CryptoKey> {
  const pub = b64urlToBytes(env.VAPID_PUBLIC_KEY);
  const d = env.VAPID_PRIVATE_KEY;
  const jwk: JsonWebKey = {
    kty: "EC",
    crv: "P-256",
    x: bytesToB64url(pub.slice(1, 33)),
    y: bytesToB64url(pub.slice(33, 65)),
    d,
    ext: true,
  };
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
}

async function vapidJwt(env: Env, audience: string): Promise<string> {
  const header = bytesToB64url(
    new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })),
  );
  const exp = Math.floor(Date.now() / 1000) + 12 * 60 * 60;
  const payload = bytesToB64url(
    new TextEncoder().encode(
      JSON.stringify({ aud: audience, exp, sub: env.VAPID_SUBJECT }),
    ),
  );
  const unsigned = `${header}.${payload}`;
  const key = await importVapidKey(env);
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsigned),
  );
  return `${unsigned}.${bytesToB64url(sig)}`;
}

export type PushResult = { ok: boolean; status: number; gone: boolean };

export async function sendPush(
  env: Env,
  sub: SubscriptionRow,
  payload: PushPayload,
): Promise<PushResult> {
  const audience = new URL(sub.endpoint).origin;
  const jwt = await vapidJwt(env, audience);
  const body = await encryptPushPayload(sub.p256dh, sub.auth, payload);

  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      TTL: "600",
      Authorization: `vapid t=${jwt}, k=${env.VAPID_PUBLIC_KEY}`,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      "Content-Length": String(body.byteLength),
    },
    body,
  });

  return {
    ok: res.ok,
    status: res.status,
    gone: res.status === 404 || res.status === 410,
  };
}
