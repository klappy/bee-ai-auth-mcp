/**
 * Actions OIDC grant resolution — reads the Bee credential captured at consent.
 *
 * workers-oauth-provider encrypts grant props with a key wrapped by the MCP
 * access token, so the Worker cannot decrypt an existing OAuth grant without
 * a client-presented token. For GitHub Actions OIDC (no MCP client), we seal a
 * sidecar at the same moment the grant is bound: consent paste or QR pairing.
 * Same custody rules — GITHUB_CLIENT_SECRET-derived AES-GCM, never logged, never
 * returned on the wire. Updated whenever the operator reconnects.
 */

const SEAL_INFO = "actions-grant-v1";

function te(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

async function sealKey(secret: string): Promise<CryptoKey> {
  const ikm = await crypto.subtle.importKey("raw", te(secret), "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: te("bee-actions-grant"), info: te(SEAL_INFO) },
    ikm,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function b64urlFromBytes(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function kvKey(login: string): string {
  return `actions-grant:${login.toLowerCase()}`;
}

/** Seal and store the operator's Bee bearer for the Actions OIDC seat. */
export async function bindActionsGrant(
  kv: KVNamespace,
  login: string,
  beeToken: string,
  secret: string
): Promise<void> {
  const key = await sealKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, te(JSON.stringify({ beeToken })))
  );
  const packed = new Uint8Array(iv.length + ct.length);
  packed.set(iv, 0);
  packed.set(ct, iv.length);
  await kv.put(kvKey(login), b64urlFromBytes(packed));
}

/** Resolve the sealed Bee bearer for an allow-listed GitHub login. */
export async function resolveActionsGrant(
  kv: KVNamespace,
  login: string,
  secret: string
): Promise<string | null> {
  const blob = await kv.get(kvKey(login));
  if (!blob) return null;
  let packed: Uint8Array;
  try {
    packed = b64urlToBytes(blob);
  } catch {
    return null;
  }
  if (packed.length < 13) return null;
  const iv = packed.slice(0, 12);
  const ct = packed.slice(12);
  const key = await sealKey(secret);
  let plain: ArrayBuffer;
  try {
    plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  } catch {
    return null;
  }
  try {
    const parsed = JSON.parse(new TextDecoder().decode(plain)) as { beeToken?: string };
    const token = typeof parsed.beeToken === "string" ? parsed.beeToken.trim() : "";
    return token || null;
  } catch {
    return null;
  }
}
