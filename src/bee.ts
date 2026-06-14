/**
 * Thin Bee client — Phase 1 reaches exactly one confirmed endpoint: GET /v1/me.
 *
 * THE PRIVATE-CA SEAM (Phase-1 tripwire, docs/phase-1-execution-handoff.md §4):
 * Bee's docs require trusting a private CA for the direct API. Standard
 * Cloudflare Workers `fetch` trusts ONLY publicly-trusted CAs — there is no
 * per-request CA override. So this plain fetch works IFF Bee's real API base
 * presents a publicly-trusted cert. If it is private-CA-fronted, this call
 * fails at TLS and the path is Workers VPC (Origin-CA) / mTLS — confirm
 * reachability from a non-proxied environment before relying on this.
 *
 * HONEST + SAFEST (binding constraint): the Bee bearer is read from the
 * Worker secret and attached only to the outbound request. It is NEVER logged
 * and NEVER serialized into a returned error. Errors carry status + a generic
 * message only — never the request, headers, or raw upstream body.
 */

import type { Env } from "./types";

export interface BeeWhoami {
  ok: true;
  account: unknown; // shape unconfirmed against the live API — passed through minimally
}

export interface BeeError {
  ok: false;
  status: number | null;
  message: string;
}

export async function beeWhoami(env: Env): Promise<BeeWhoami | BeeError> {
  if (!env.BEE_API_TOKEN || !env.BEE_API_BASE) {
    return { ok: false, status: null, message: "Bee not configured: set BEE_API_BASE and the BEE_API_TOKEN secret." };
  }

  let res: Response;
  try {
    res = await fetch(`${env.BEE_API_BASE.replace(/\/+$/, "")}/v1/me`, {
      headers: {
        authorization: `Bearer ${env.BEE_API_TOKEN}`,
        accept: "application/json",
        "user-agent": "bee-ai-auth-mcp",
      },
    });
  } catch {
    // Most likely the private-CA TLS wall (see seam note above). Do not echo
    // the request or any secret — a generic, actionable message only.
    return {
      ok: false,
      status: null,
      message:
        "Could not reach the Bee API. If Bee's direct API uses a private CA, a Cloudflare Worker " +
        "cannot trust it via plain fetch — see the Phase-1 reachability tripwire (Workers VPC / mTLS).",
    };
  }

  if (!res.ok) {
    // Never serialize the upstream body or our request — status + generic text only.
    return {
      ok: false,
      status: res.status,
      message:
        res.status === 401 || res.status === 403
          ? "Bee rejected the credential (401/403). Rotate BEE_API_TOKEN in the Bee app and re-set the Worker secret."
          : `Bee returned an unexpected status (${res.status}).`,
    };
  }

  const account = (await res.json().catch(() => null)) as unknown;
  return { ok: true, account };
}
