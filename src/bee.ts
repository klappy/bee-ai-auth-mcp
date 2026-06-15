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
  return { ok: true, account };
}
