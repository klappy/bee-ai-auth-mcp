/**
 * Thin Bee client — Phase 1 reaches exactly one confirmed endpoint: GET /v1/me
 * (Bee docs, "API": `GET /v1/me` returns the user profile; confirmed 2026-06-07).
 *
 * CUSTODY (v0.3 amendment, ledger E0012): the Bee bearer is NO LONGER a Worker
 * secret. It is passed in explicitly — the caller reads it from the request's
 * decrypted per-grant props (GrantProps.beeToken) or, at consent time, from the
 * value the operator just pasted (to validate it before binding). This module
 * never touches `env.BEE_API_TOKEN` (there is none).
 *
 * NETWORK PATH (private-CA bridge, resolved E0012; bound container, D0028): the
 * caller passes the bound Container stub (`getContainer(env.BEE_BRIDGE)`) and we
 * call it over an INTERNAL Worker->container fetch. Inside, caddy re-originates
 * TLS to Bee trusting bee-ca.pem, so the old "Worker can't trust Bee's private
 * CA" seam is handled by the container, not here. A transport failure now means
 * the bridge container is unreachable or misconfigured (or the BEE_BRIDGE binding
 * is missing), not a Worker TLS-trust problem.
 *
 * HONEST + SAFEST (binding): the Bee bearer is attached only to the outbound
 * request. It is NEVER logged and NEVER serialized into a returned error. Errors
 * carry status + a generic message only — never the request, headers, token, or
 * raw upstream body.
 */

export interface BeeWhoami {
  ok: true;
  account: unknown; // shape unconfirmed against the live API — passed through minimally
  /** Whether the bridge container served this request cold (telemetry only). */
  bridgeCold?: boolean;
}

export interface BeeError {
  ok: false;
  status: number | null;
  message: string;
}

/** Call GET /v1/me through the bound bridge container with an explicit bearer.
 *  The single Bee primitive. `bridge` is the stub from getContainer(env.BEE_BRIDGE). */
export async function beeGetMe(beeToken: string, bridge: DurableObjectStub): Promise<BeeWhoami | BeeError> {
  if (!beeToken || !bridge) {
    return {
      ok: false,
      status: null,
      message:
        "Bee not configured: the BEE_BRIDGE container binding must be present and the grant must carry a Bee token (reconnect to supply one).",
    };
  }

  let res: Response;
  try {
    // Internal Worker->container call. The host in this URL is arbitrary (the
    // bound container is addressed by the stub, not by DNS); caddy's :8080 port
    // site accepts any Host and forwards only /v1/* to Bee.
    res = await bridge.fetch("http://bee-bridge/v1/me", {
      headers: {
        authorization: `Bearer ${beeToken}`,
        accept: "application/json",
        "user-agent": "bee-ai-auth-mcp",
      },
    });
  } catch {
    // Bridge container unreachable / not deployed. Do NOT echo the request or any
    // secret — a generic, actionable message only.
    return {
      ok: false,
      status: null,
      message:
        "Could not reach the Bee API through the bridge. Confirm the private-CA Container bridge is deployed and the BEE_BRIDGE binding is wired (see bridge/README.md).",
    };
  }

  if (!res.ok) {
    // Never serialize the upstream body or our request — status + generic text only.
    return {
      ok: false,
      status: res.status,
      message:
        res.status === 401 || res.status === 403
          ? "Bee rejected the credential (401/403). Reconnect and paste a current Bee token, or rotate it in the Bee app."
          : `Bee returned an unexpected status (${res.status}).`,
    };
  }

  const account = (await res.json().catch(() => null)) as unknown;
  return { ok: true, account, bridgeCold: res.headers.get("x-bridge-cold") === "1" };
}

/** Bee's search endpoints are POST + JSON body but are READ operations (no
 *  mutation). They are the only non-GET paths bee_read is permitted to call. */
const BEE_SEARCH_PATHS = new Set<string>([
  "/v1/search/conversations",
  "/v1/search/conversations/neural",
]);

export interface BeeReadResult {
  ok: true;
  status: number;
  body: unknown;
  truncated?: boolean;
  /** Whether the bridge container served this request cold (telemetry only). */
  bridgeCold?: boolean;
}

/** Generalized read passthrough — the Phase-2 `bee_read` primitive. Read-only BY
 *  CONSTRUCTION: it issues GET to any /v1/* path, OR POST to an allow-listed
 *  /v1/search/* path (non-mutating search). It never issues a mutating verb, so
 *  the read-only guarantee is structural, not advisory. /v1/stream (SSE) is
 *  refused (long-lived, not request/response). Same custody, bridge, and
 *  no-secret-in-errors rules as beeGetMe. */
export async function beeRead(
  beeToken: string,
  bridge: DurableObjectStub,
  rawPath: string,
  searchBody?: unknown
): Promise<BeeReadResult | BeeError> {
  if (!beeToken || !bridge) {
    return {
      ok: false,
      status: null,
      message:
        "Bee not configured: the BEE_BRIDGE container binding must be present and the grant must carry a Bee token (reconnect to supply one).",
    };
  }
  const path = (rawPath || "").trim();
  if (!path.startsWith("/v1/") || path.includes("..")) {
    return { ok: false, status: null, message: "Path must be a Bee API path beginning with /v1/ (no traversal)." };
  }
  const pathname = path.split("?")[0];
  if (pathname === "/v1/stream") {
    return { ok: false, status: null, message: "/v1/stream is a Server-Sent Events stream and is not available through bee_read." };
  }
  const isSearch = BEE_SEARCH_PATHS.has(pathname);
  const method = isSearch ? "POST" : "GET";

  const headers: Record<string, string> = {
    authorization: `Bearer ${beeToken}`,
    accept: "application/json",
    "user-agent": "bee-ai-auth-mcp",
  };
  const init: RequestInit = { method, headers };
  if (isSearch) {
    headers["content-type"] = "application/json";
    init.body = JSON.stringify(searchBody ?? {});
  }

  let res: Response;
  try {
    res = await bridge.fetch(`http://bee-bridge${path}`, init);
  } catch {
    return {
      ok: false,
      status: null,
      message:
        "Could not reach the Bee API through the bridge. Confirm the private-CA Container bridge is deployed and the BEE_BRIDGE binding is wired (see bridge/README.md).",
    };
  }

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      message:
        res.status === 401 || res.status === 403
          ? "Bee rejected the credential (401/403). Reconnect and paste a current Bee token, or rotate it in the Bee app."
          : `Bee returned an unexpected status (${res.status}).`,
    };
  }

  const text = await res.text().catch(() => "");
  const CAP = 512 * 1024; // guard so a huge list can't blow the client's context
  if (text.length > CAP) {
    return {
      ok: true,
      status: res.status,
      truncated: true,
      bridgeCold: res.headers.get("x-bridge-cold") === "1",
      body: {
        note: "Response exceeded the 512KB read cap and was truncated. Use pagination (limit/cursor) or a narrower path/query.",
        preview: text.slice(0, CAP),
      },
    };
  }
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { ok: true, status: res.status, body, bridgeCold: res.headers.get("x-bridge-cold") === "1" };
}
