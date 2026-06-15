/** Round-trip the parsed OAuth request through GitHub's `state` parameter.
 *  Not secret (PKCE protects the grant); integrity is re-checked by the
 *  provider at completeAuthorization. Ported verbatim from git-repo-auth-mcp. */
export function encodeState(obj: unknown): string {
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeState<T>(s: string): T {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}

// ---------------------------------------------------------------------------
// Signed consent state (v0.3 per-grant custody)
//
// The GitHub leg proves identity in /callback, then the GitHub user token is
// discarded. To capture the Bee token we render a consent form and POST it back
// to /consent — but by then we no longer have GitHub to re-derive the login.
// So we carry the gate-verified { oauthReqInfo, login } across that round-trip
// HMAC-signed, so the login the allow-list approved cannot be swapped by a
// tampered form field. The signing key is GITHUB_CLIENT_SECRET (already a
// server-only secret; no new secret to steward). The payload is NOT
// confidential (no token rides in it) — it is integrity-protected, not hidden.
// ---------------------------------------------------------------------------

function b64urlEncodeBytes(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecodeToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/** Constant-time-ish comparison over equal-length byte arrays. */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

/** Produce `<b64url(payload)>.<b64url(hmac)>` for the consent form hidden field. */
export async function signConsent(payload: unknown, secret: string): Promise<string> {
  const json = JSON.stringify(payload);
  const body = b64urlEncodeBytes(new TextEncoder().encode(json));
  const key = await hmacKey(secret);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)));
  return `${body}.${b64urlEncodeBytes(sig)}`;
}

/** Verify and decode a consent blob. Returns null on any tamper/format failure. */
export async function verifyConsent<T>(blob: string, secret: string): Promise<T | null> {
  const dot = blob.indexOf(".");
  if (dot <= 0) return null;
  const body = blob.slice(0, dot);
  const sigPart = blob.slice(dot + 1);
  if (!sigPart) return null;
  let presented: Uint8Array;
  try {
    presented = b64urlDecodeToBytes(sigPart);
  } catch {
    return null;
  }
  const key = await hmacKey(secret);
  const expected = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)));
  if (!timingSafeEqual(presented, expected)) return null;
  try {
    return JSON.parse(new TextDecoder().decode(b64urlDecodeToBytes(body))) as T;
  } catch {
    return null;
  }
}
