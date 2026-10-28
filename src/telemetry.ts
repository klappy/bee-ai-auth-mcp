import { isStaging } from './types';
/**
 * Telemetry — minimal, optional, privacy-first observability for the read surface.
 *
 * Governance: docs/telemetry-governance.md (klappy://docs/products/bee-ai-auth-mcp/
 * telemetry-governance). Emission pattern: klappy://canon/decisions/
 * DR-20260514-0001-telemetry-wrapper-pattern (one wrapper per tool, in-memory,
 * per-call, swallow-on-failure, no domain opinion in the wrapper itself).
 *
 * WHAT THIS RECORDS: shape, never substance — tool name, a coarse Bee path CLASS
 * (never the raw path or a conversation id), cold/warm bridge state, a status
 * class, durations, and response byte size. It NEVER records the Bee token,
 * conversation content, raw paths/ids, search bodies, or any reversible identity.
 *
 * STAGING: bypasses legacy AE entirely; optional owner-only daily aggregates
 * contain no identity, hash or per-call record (see owner-usage.ts).
 * LEGACY PRODUCTION: each row is keyed by an OPAQUE per-login tenant key — an HMAC of
 * the login under the existing GITHUB_CLIENT_SECRET (same secret-reuse precedent
 * in legacy telemetry), never the login/Bee-id/email/token in the clear. Constant
 * under the single-tenant allow-list today; the partition key when the allow-list
 * widens (grant-level isolation, ledger E0014).
 *
 * SELF-HOST: the Analytics Engine binding is OPTIONAL. If BEE_TELEMETRY is unbound,
 * every emit is a silent no-op and the server behaves identically. No data ever
 * leaves the operator's own Cloudflare account.
 *
 * SLOT MAP IS STICKY — never reorder blobs/doubles; reuse-by-renumber is how the
 * upstream oddkit telemetry acquired bugs. Append only.
 */

import { COMMIT_SHA } from "./version";
import type { Env } from "./types";
import { ownerUsageEnabled, recordOwnerUsage, type OwnerOutcome } from "./owner-usage";

/** Per-call record a tool handler populates with the domain-specific facts the
 *  generic wrapper cannot see (path class, bridge timing/cold, status). */
export interface ToolTelemetry {
  /** Only set after bee_read returns its actual result. */
  readSucceeded?: boolean;
  /** Runtime or allowance blocked the requested tool. */
  blocked?: boolean;
  /** Coarse Bee path class for bee_read — NEVER the raw path or an id. */
  pathClass?: string;
  /** Wall-clock of the Bee call through the bridge (ms). */
  bridgeMs?: number;
  /** Whether the bound container served this request cold (from x-bridge-cold). */
  bridgeCold?: boolean;
  /** '2xx' | '4xx' | '5xx' | 'transport_fail' | 'n/a'. */
  statusClass?: string;
  /** Cache effectiveness — 0 until a cache tier exists. */
  cacheHits?: number;
  cacheLookups?: number;
}

/** Opaque, stable, per-login legacy production tenant key. Reuses GITHUB_CLIENT_SECRET
 *  as the HMAC key (already a server-only secret; see src/state.ts). Falls back to
 *  a constant on any crypto failure — telemetry must never break a request. */
export async function deriveTenantKey(env: Env, login: string): Promise<string> {
  // Staging uses no tenant key or AE row, even if an AE binding is accidentally present.
  if (isStaging(env)) return '';
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(env.GITHUB_CLIENT_SECRET ?? ""),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode("bee-tenant:" + login)));
    let bin = "";
    for (const b of sig) bin += String.fromCharCode(b);
    const b64 = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return "t_" + b64.slice(0, 16);
  } catch {
    return "t_unknown";
  }
}

/** Map a Bee path to a coarse CLASS. Strips query + ids; never returns the raw path. */
export function classifyPath(path: string | undefined): string {
  const p = (path ?? "").split("?")[0];
  if (p === "/v1/me") return "me";
  if (p.startsWith("/v1/search")) return "search";
  if (p.startsWith("/v1/conversations")) return "conversations";
  if (p.startsWith("/v1/")) return "other";
  return "n/a";
}

/** Bucket an HTTP-ish status into a class. null/undefined => transport failure. */
export function statusClassOf(status: number | null | undefined): string {
  if (status == null) return "transport_fail";
  if (status >= 200 && status < 300) return "2xx";
  if (status >= 400 && status < 500) return "4xx";
  if (status >= 500) return "5xx";
  return "other";
}

function bytesOut(result: unknown): number {
  try {
    const content = (result as { content?: Array<{ text?: string }> } | undefined)?.content ?? [];
    let n = 0;
    for (const c of content) if (typeof c.text === "string") n += new TextEncoder().encode(c.text).length;
    return n;
  } catch {
    return 0;
  }
}

/**
 * Wrap a tool handler with one measurement per call. Staging optionally sends
 * owner-only aggregates through waitUntil; production retains its legacy AE path. The wrapper
 * times total wall-clock and reads the envelope size; the handler contributes the
 * domain facts via the `tele` record it is handed. Legacy AE emission is synchronous;
 * staging DO work is caught and attached to waitUntil. Neither an enqueue nor a
 * successful tool call proves aggregate persistence; hosted readback is required.
 */
export function withTelemetry<Args extends unknown[], R>(
  env: Env,
  tenantKey: string,
  tool: string,
  build: (tele: ToolTelemetry) => (...args: Args) => Promise<R>,
  observation?: { login: string; waitUntil: (promise: Promise<unknown>) => void }
): (...args: Args) => Promise<R> {
  return async (...args: Args): Promise<R> => {
    const tele: ToolTelemetry = {};
    const t0 = Date.now();
    const emitOwner = (result: unknown, thrown = false): void => {
      try {
        if (!observation || !ownerUsageEnabled(env, observation.login) || !['bee_read', 'bee_docs', 'whoami'].includes(tool)) return;
        const outcome: OwnerOutcome = thrown ? 'error' : tele.blocked ? 'blocked' : tool === 'bee_docs' ? 'docs' : tool === 'whoami' ? 'identity' : tele.readSucceeded === true ? 'read_success' : 'read_failure';
        observation.waitUntil(recordOwnerUsage(env, observation.login, {
          outcome, pathClass: tele.pathClass, statusClass: thrown ? 'transport_fail' : tele.statusClass ?? 'n/a',
          durationMs: Date.now() - t0, bridgeMs: tele.bridgeMs, bytesOut: bytesOut(result),
        }));
      } catch { /* telemetry never changes the original result or error */ }
    };
    let result: R;
    try { result = await build(tele)(...args); }
    catch (error) { if (isStaging(env)) emitOwner(undefined, true); throw error; }
    if (isStaging(env)) { emitOwner(result); return result; }
    const durationMs = Date.now() - t0;
    try {
      const ds = env.BEE_TELEMETRY;
      if (ds) {
        const bridgeState = tele.bridgeCold === undefined ? "n/a" : tele.bridgeCold ? "cold" : "warm";
        const statusClass = tele.statusClass ?? ((result as { isError?: boolean })?.isError ? "5xx" : "2xx");
        // SLOT MAP (sticky — append only):
        // blobs:   1 event_type | 2 tenant | 3 tool | 4 path_class | 5 bridge_state | 6 status_class | 7 worker_version
        // doubles: 1 count | 2 duration_ms | 3 bridge_ms | 4 bytes_out | 5 cache_hits | 6 cache_lookups
        ds.writeDataPoint({
          indexes: [tenantKey],
          blobs: ["tool_call", tenantKey, tool, tele.pathClass ?? "n/a", bridgeState, statusClass, COMMIT_SHA],
          doubles: [1, durationMs, tele.bridgeMs ?? 0, bytesOut(result), tele.cacheHits ?? 0, tele.cacheLookups ?? 0],
        });
      }
    } catch {
      // swallow — telemetry must never break a request
    }
    return result;
  };
}
