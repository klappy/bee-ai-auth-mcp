/**
 * Server-side Bee QR pairing (the consent screen's scan-and-approve path).
 *
 * Replicates the @beeai/cli pairing handshake from inside the Worker so the
 * consent screen can offer a QR instead of token-hunting. Protocol facts were
 * re-verified against the @beeai/cli@0.7.3 binary and a live probe on
 * 2026-07-05 (odd/ledger/2026-07-05-consent-qr-pairing-execution.md):
 *
 *   POST https://auth.beeai-services.com/apps/pairing/request
 *        { app_id, publicKey (base64 x25519) }
 *     -> { ok, status: "pending",   requestId, expiresAt }       (fresh key)
 *     -> { ok, status: "pending",   requestId, expiresAt }       (re-POST = poll)
 *     -> { ok, status: "completed", requestId, encryptedToken }  (after approval)
 *     -> { ok, status: "expired",   requestId }                  (~5-min window)
 *
 *   The poll IS the same POST — the service is idempotent on publicKey, so a
 *   stateless Worker can poll without remembering anything server-side.
 *
 *   encryptedToken = base64( version(1)=0x01 || nonce(24) || senderPk(32) || box )
 *   i.e. crypto_box (x25519-xsalsa20-poly1305) sealed to OUR ephemeral key.
 *
 * Custody: the Worker keeps NO pairing state. The ephemeral keypair rides in a
 * sealed blob — AES-256-GCM under an HKDF-SHA256 key derived from
 * GITHUB_CLIENT_SECRET (already the consent-HMAC anchor; no new secret to
 * steward) — held by the consent page and posted back on each poll. The
 * secret key is plaintext only inside a single request invocation; the Bee
 * token, once decrypted, follows the exact paste-path route (bridge-validated
 * via beeGetMe, then straight into encrypted grant props). Nothing secret is
 * ever logged; requestIds and public keys are the only pairing material that
 * may surface in logs or UI (charter §5).
 */

import nacl from "tweetnacl";

// ---- protocol constants (verbatim from @beeai/cli@0.7.3) ----
export const PAIRING_URL = "https://auth.beeai-services.com/apps/pairing/request";
/** The Bee CLI's registered prod app id. Reusing it means the Bee approval
 *  screen presents as the CLI — accepted for personal self-host (charter §3,
 *  ledger D0035); a relay-registered app id is the multi-tenant gate. Do not
 *  mint, register, or spoof any other app identity without an operator ruling. */
export const BEE_CLI_APP_ID = "ph9fssu1kv1b0hns69fxf7rx";
const ENCRYPTION_VERSION = 1;
const NONCE_SIZE = 24;
const PUBLIC_KEY_SIZE = 32;
const MIN_ENVELOPE_SIZE = 1 + NONCE_SIZE + PUBLIC_KEY_SIZE + 16;
/** Belt-and-braces ceiling on sealed-state age; the service itself expires
 *  pairings at ~5 minutes. */
const SEALED_MAX_AGE_MS = 15 * 60 * 1000;

// ---- byte/base64 helpers (standard base64 — the pairing wire format) ----
function te(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

export function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function b64ToBytes(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64urlFromBytes(bytes: Uint8Array): string {
  return bytesToB64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(s: string): Uint8Array {
  return b64ToBytes(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4));
}

// ---- ephemeral keypair ----
export interface PairingKeyPair {
  /** standard base64, exactly as sent in the pairing request body */
  publicKeyB64: string;
  secretKey: Uint8Array;
}

export function generatePairingKeyPair(): PairingKeyPair {
  const kp = nacl.box.keyPair();
  return { publicKeyB64: bytesToB64(kp.publicKey), secretKey: kp.secretKey };
}

// ---- the pairing request/poll (one POST; idempotent on publicKey) ----
export type PairingOutcome =
  | { status: "pending"; requestId: string; expiresAt: string }
  | { status: "completed"; requestId: string; encryptedToken: string }
  | { status: "expired" }
  | { status: "error"; message: string };

export async function postPairing(
  publicKeyB64: string,
  fetcher: typeof fetch = fetch
): Promise<PairingOutcome> {
  let res: Response;
  try {
    res = await fetcher(PAIRING_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ app_id: BEE_CLI_APP_ID, publicKey: publicKeyB64 }),
    });
  } catch {
    return { status: "error", message: "pairing service unreachable" };
  }
  let data: Record<string, unknown>;
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    return { status: "error", message: `pairing service returned ${res.status}` };
  }
  if (!res.ok) return { status: "error", message: `pairing service returned ${res.status}` };
  const requestId = data["requestId"];
  const expiresAt = data["expiresAt"];
  const encryptedToken = data["encryptedToken"];
  switch (data["status"]) {
    case "pending":
      if (typeof requestId === "string" && typeof expiresAt === "string") {
        return { status: "pending", requestId, expiresAt };
      }
      break;
    case "completed":
      if (typeof requestId === "string" && typeof encryptedToken === "string") {
        return { status: "completed", requestId, encryptedToken };
      }
      break;
    case "expired":
      return { status: "expired" };
  }
  return { status: "error", message: "unexpected pairing response shape" };
}

/** The QR/deep-link target. Encodes ONLY the requestId — no secret in the image. */
export function buildConnectUrl(requestId: string): string {
  return `https://bee.computer/connect#${requestId}`;
}

// ---- envelope open: version(1) || nonce(24) || senderPk(32) || box ----
/** Returns the decrypted Bee token, or null on any format/auth failure.
 *  The returned string is a secret: never log it, never echo it. */
export function openPairingEnvelope(
  encryptedTokenB64: string,
  secretKey: Uint8Array
): string | null {
  let packed: Uint8Array;
  try {
    packed = b64ToBytes(encryptedTokenB64);
  } catch {
    return null;
  }
  if (packed.length < MIN_ENVELOPE_SIZE) return null;
  if (packed[0] !== ENCRYPTION_VERSION) return null;
  const nonce = packed.subarray(1, 1 + NONCE_SIZE);
  const senderPk = packed.subarray(1 + NONCE_SIZE, 1 + NONCE_SIZE + PUBLIC_KEY_SIZE);
  const box = packed.subarray(1 + NONCE_SIZE + PUBLIC_KEY_SIZE);
  const opened = nacl.box.open(box, nonce, senderPk, secretKey);
  if (!opened) return null;
  return new TextDecoder().decode(opened);
}

// ---- sealed pairing state: AES-GCM under HKDF(GITHUB_CLIENT_SECRET) ----
// The consent page carries this blob (ciphertext only) between /pairing/start
// and each /pairing/status poll, so the ephemeral secret key never exists at
// rest server-side and never exists in plaintext client-side.
export interface SealedPairingState {
  /** ephemeral x25519 public key, standard base64 (as sent on the wire) */
  pk: string;
  /** ephemeral x25519 secret key, standard base64 — plaintext only in-Worker */
  sk: string;
  requestId: string;
  /** gate-verified login this pairing belongs to; must match the signed consent state */
  login: string;
  /** OAuth client this pairing was started for; must match the signed consent
   *  state so a captured blob can't be replayed against a different client */
  clientId: string;
  /** issued-at, ms epoch */
  iat: number;
}

async function sealKey(secret: string): Promise<CryptoKey> {
  const ikm = await crypto.subtle.importKey("raw", te(secret), "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: te("bee-pairing-v1"), info: te("sealed-state") },
    ikm,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function sealPairingState(
  state: SealedPairingState,
  secret: string
): Promise<string> {
  const key = await sealKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, te(JSON.stringify(state)))
  );
  const packed = new Uint8Array(iv.length + ct.length);
  packed.set(iv, 0);
  packed.set(ct, iv.length);
  return b64urlFromBytes(packed);
}

/** Returns null on any tamper/format/shape/age failure. */
export async function unsealPairingState(
  blob: string,
  secret: string,
  now: number = Date.now()
): Promise<SealedPairingState | null> {
  let packed: Uint8Array;
  try {
    packed = b64urlToBytes(blob);
  } catch {
    return null;
  }
  if (packed.length <= 12) return null;
  const iv = packed.subarray(0, 12);
  const ct = packed.subarray(12);
  let plain: Uint8Array;
  try {
    const key = await sealKey(secret);
    plain = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct));
  } catch {
    return null;
  }
  let state: SealedPairingState;
  try {
    state = JSON.parse(new TextDecoder().decode(plain)) as SealedPairingState;
  } catch {
    return null;
  }
  if (
    typeof state?.pk !== "string" ||
    typeof state?.sk !== "string" ||
    typeof state?.requestId !== "string" ||
    typeof state?.login !== "string" ||
    typeof state?.clientId !== "string" ||
    typeof state?.iat !== "number"
  ) {
    return null;
  }
  if (now - state.iat > SEALED_MAX_AGE_MS) return null;
  return state;
}
