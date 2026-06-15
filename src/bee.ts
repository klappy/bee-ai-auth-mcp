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
 * NETWORK PATH (private-CA bridge, resolved E0012): `base` points at the caddy
 * Container bridge, which presents a PUBLIC cert to this Worker and re-originates
 * TLS to Bee trusting bee-ca.pem. So this is a plain `fetch` to a public-cert
 * host — the old "Worker can't trust Bee's private CA" seam is handled by the
 * bridge, not here. A transport failure now means the bridge is unreachable or
 * misconfigured (or BEE_API_BASE is unset), not a Worker TLS-trust problem.
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

/** Call GET {base}/v1/me with an explicit bearer. The single Bee primitive. */
export async function beeGetMe(beeToken: string, beeApiBase: string): Promise<BeeWhoami | BeeError> {
  if (!beeToken || !beeApiBase) {
    return {
      ok: false,
      status: null,
      message:
        "Bee not configured: BEE_API_BASE must point at the private-CA bridge and the grant must carry a Bee token (reconnect to supply one).",
    };
  }

  let res: Response;
  try {
    res = await fetch(`${beeApiBase.replace(/\/+$/, "")}/v1/me`, {
      headers: {
        authorization: `Bearer ${beeToken}`,
        accept: "application/json",
        "user-agent": "bee-ai-auth-mcp",
      },
    });
  } catch {
    // Bridge unreachable / not deployed / BEE_API_BASE wrong. Do NOT echo the
    // request or any secret — a generic, actionable message only.
    return {
      ok: false,
      status: null,
      message:
        "Could not reach the Bee API through the bridge. Confirm the private-CA Container bridge is deployed and BEE_API_BASE points at it (see bridge/README.md).",
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
