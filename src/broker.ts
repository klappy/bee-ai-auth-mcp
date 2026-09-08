/**
 * Hosted Bee CLI auth broker — one-shot pairing, never a shared Bee session.
 *
 * Kitchen: rail/3-pass/2026-08-13-bee-relay-cf-access/CLI-BROKER-AMENDMENT-2026-09-08.md
 *
 * The bound container's long-lived process remains caddy (token-agnostic data
 * plane). Bee CLI runs only via Container exec under an opaque per-attempt
 * BEE_CONFIG_DIR. The resulting bearer is moved into encrypted grant props and
 * the broker directory is deleted. Never derive a path from email/login.
 * Never log a token, CLI stdout wholesale, or broker directory contents.
 */

// ---- opaque broker id (never email / login / clientId) ----
export const BROKER_ID_RE = /^[a-f0-9]{32}$/;
export const BROKER_ROOT = "/tmp/bee-broker";

export function newBrokerId(random: Uint8Array = crypto.getRandomValues(new Uint8Array(16))): string {
  return Array.from(random, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function assertBrokerId(id: string): string | null {
  return BROKER_ID_RE.test(id) ? id : null;
}

/** Absolute config dir for one pairing attempt. Null on any id that is not opaque hex. */
export function brokerConfigDir(id: string): string | null {
  const ok = assertBrokerId(id);
  return ok ? `${BROKER_ROOT}/${ok}` : null;
}

/**
 * Best-effort delete target. Returns the exact directory to remove, or null if
 * the id is invalid. Callers must refuse to delete anything else — including
 * BROKER_ROOT itself or a sibling.
 */
export function brokerClearTarget(id: string): string | null {
  return brokerConfigDir(id);
}

export function brokerClearWouldTouch(otherId: string, targetId: string): boolean {
  const a = brokerClearTarget(otherId);
  const b = brokerClearTarget(targetId);
  return Boolean(a && b && a === b);
}

// ---- CLI connect-URL extraction (the only pairing material allowed out) ----
const CONNECT_URL_RE = /https:\/\/bee\.computer\/connect#[A-Za-z0-9_-]+/;

export function extractConnectUrl(text: string): string | null {
  const m = text.match(CONNECT_URL_RE);
  return m ? m[0] : null;
}

// ---- broker helper wire (one JSON line on stdout) ----
export type BrokerStartResult =
  | { status: "pending"; connectUrl: string; expiresAt?: string }
  | { status: "error"; message: string };

export type BrokerResumeResult =
  | { status: "pending" }
  | { status: "expired" }
  | { status: "completed"; token: string }
  | { status: "error"; message: string };

export type BrokerClearResult = { status: "cleared" } | { status: "error"; message: string };

const SENSITIVE_KEY_RE = /token|secret|key|authorization|bearer/i;

/** Redact token/secret fields for any diagnostic. Never log the raw helper line. */
export function sanitizeBrokerLine(line: string): string {
  const trimmed = line.trim();
  if (!trimmed) return "<empty>";
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return "<non-object>";
    }
    const parts: string[] = [];
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (SENSITIVE_KEY_RE.test(k)) {
        const n = typeof v === "string" ? v.length : JSON.stringify(v)?.length ?? 0;
        parts.push(`${k}=<redacted:${n}>`);
      } else if (typeof v === "string") {
        parts.push(`${k}=${v.length > 80 ? `${v.slice(0, 79)}…` : v}`);
      } else {
        parts.push(`${k}=${typeof v}`);
      }
    }
    return `{${parts.join(", ")}}`;
  } catch {
    // Refuse to echo unstructured CLI text — it can contain a token or QR.
    return `<non-json:${trimmed.length}>`;
  }
}

export function parseBrokerStart(stdout: string): BrokerStartResult {
  const parsed = parseFirstJsonObject(stdout);
  if (!parsed) return { status: "error", message: "hosted Bee CLI broker returned no result" };
  if (parsed.status === "pending" && typeof parsed.connectUrl === "string") {
    if (!extractConnectUrl(parsed.connectUrl)) {
      return { status: "error", message: "hosted Bee CLI broker returned an invalid connect URL" };
    }
    const expiresAt = typeof parsed.expiresAt === "string" ? parsed.expiresAt : undefined;
    return expiresAt
      ? { status: "pending", connectUrl: parsed.connectUrl, expiresAt }
      : { status: "pending", connectUrl: parsed.connectUrl };
  }
  if (parsed.status === "error") {
    return { status: "error", message: brokerErrorMessage(parsed.message) };
  }
  return { status: "error", message: "hosted Bee CLI broker returned an unexpected start shape" };
}

export function parseBrokerResume(stdout: string): BrokerResumeResult {
  const parsed = parseFirstJsonObject(stdout);
  if (!parsed) return { status: "error", message: "hosted Bee CLI broker returned no result" };
  if (parsed.status === "pending") return { status: "pending" };
  if (parsed.status === "expired") return { status: "expired" };
  if (parsed.status === "completed" && typeof parsed.token === "string" && parsed.token.length > 0) {
    return { status: "completed", token: parsed.token };
  }
  if (parsed.status === "error") {
    return { status: "error", message: brokerErrorMessage(parsed.message) };
  }
  return { status: "error", message: "hosted Bee CLI broker returned an unexpected resume shape" };
}

function brokerErrorMessage(message: unknown): string {
  return typeof message === "string" && message.length > 0 && message.length < 200
    ? message
    : "hosted Bee CLI broker failed";
}

function parseFirstJsonObject(stdout: string): Record<string, unknown> | null {
  for (const line of stdout.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("{")) continue;
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      continue;
    }
  }
  return null;
}

// ---- sealed broker state (consent page carries ciphertext only) ----
export interface SealedBrokerState {
  kind: "cli-broker-v1";
  brokerId: string;
  login: string;
  clientId: string;
  iat: number;
}

const SEALED_MAX_AGE_MS = 15 * 60 * 1000;

function te(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function b64urlFromBytes(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function sealKey(secret: string): Promise<CryptoKey> {
  const ikm = await crypto.subtle.importKey("raw", te(secret), "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: te("bee-broker-v1"), info: te("sealed-state") },
    ikm,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function sealBrokerState(state: SealedBrokerState, secret: string): Promise<string> {
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

export async function unsealBrokerState(
  blob: string,
  secret: string,
  now: number = Date.now()
): Promise<SealedBrokerState | null> {
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
  let state: SealedBrokerState;
  try {
    state = JSON.parse(new TextDecoder().decode(plain)) as SealedBrokerState;
  } catch {
    return null;
  }
  if (
    state?.kind !== "cli-broker-v1" ||
    !assertBrokerId(state.brokerId) ||
    typeof state.login !== "string" ||
    typeof state.clientId !== "string" ||
    typeof state.iat !== "number"
  ) {
    return null;
  }
  if (now - state.iat > SEALED_MAX_AGE_MS) return null;
  return state;
}

/** Compiled helper — no bun/shell in the final image. */
export const BROKER_HELPER_ARGV = ["/opt/bee-broker/broker"] as const;

export const BROKER_COMMANDS = ["start", "resume", "clear"] as const;
export type BrokerCommand = (typeof BROKER_COMMANDS)[number];

/** The only argv BeeBridge may exec. Never `bee proxy` — that injects one
 *  CLI login's bearer into every /v1 request (bee-cli proxy/index.ts). */
export function brokerExecArgv(command: string, brokerId: string): string[] | null {
  if (!BROKER_COMMANDS.includes(command as BrokerCommand)) return null;
  if (!assertBrokerId(brokerId)) return null;
  return [...BROKER_HELPER_ARGV, command, brokerId];
}

export interface BeeBroker {
  startBeeBroker(brokerId: string): Promise<BrokerStartResult>;
  resumeBeeBroker(brokerId: string): Promise<BrokerResumeResult>;
  clearBeeBroker(brokerId: string): Promise<BrokerClearResult>;
}
