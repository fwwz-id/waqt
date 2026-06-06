/** RFC 8291 aes128gcm payload encryption for Web Push. */

export type PushPayload = {
  title: string;
  body: string;
  prayer?: string;
  tag?: string;
};

function b64urlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const len = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(len);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}

async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number,
): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", ikm, "HKDF", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt, info },
    key,
    length * 8,
  );
  return new Uint8Array(bits);
}

export async function encryptPushPayload(
  p256dh: string,
  auth: string,
  payload: PushPayload,
): Promise<Uint8Array> {
  const userPublicKey = b64urlToBytes(p256dh);
  const userAuth = b64urlToBytes(auth);
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));

  const localKeyPair = (await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  )) as CryptoKeyPair;

  const localPublicKeyRaw = await crypto.subtle.exportKey(
    "raw",
    localKeyPair.publicKey,
  );
  const localPublicKey = new Uint8Array(localPublicKeyRaw as ArrayBuffer);

  const userKey = await crypto.subtle.importKey(
    "raw",
    userPublicKey,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );

  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: userKey } as { name: "ECDH"; public: CryptoKey },
      localKeyPair.privateKey,
      256,
    ),
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const authInfo = new TextEncoder().encode("Content-Encoding: auth\0");
  const authSecret = await hkdf(userAuth, sharedSecret, authInfo, 32);
  const ikm = concat(authSecret, userAuth);

  const cekInfo = new TextEncoder().encode("Content-Encoding: aes128gcm\0");
  const contentEncryptionKey = await hkdf(salt, ikm, cekInfo, 16);

  const nonceInfo = new TextEncoder().encode("Content-Encoding: nonce\0");
  const nonce = await hkdf(salt, ikm, nonceInfo, 12);

  const padded = new Uint8Array(payloadBytes.length + 1);
  padded.set(payloadBytes);
  padded[payloadBytes.length] = 2;

  const aesKey = await crypto.subtle.importKey(
    "raw",
    contentEncryptionKey,
    "AES-GCM",
    false,
    ["encrypt"],
  );

  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: nonce, tagLength: 128 },
      aesKey,
      padded,
    ),
  );

  const recordSize = 4096;
  const body = new Uint8Array(16 + 4 + localPublicKey.length + encrypted.length);
  body.set(salt, 0);
  new DataView(body.buffer).setUint32(16, recordSize, false);
  body.set(localPublicKey, 20);
  body.set(encrypted, 20 + localPublicKey.length);
  return body;
}
