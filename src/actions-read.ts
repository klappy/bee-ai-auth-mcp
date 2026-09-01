/**
 * HTTP read surface for GitHub Actions OIDC callers.
 *
 * GET /v1/changes and GET /v1/conversations/:id only — the refinery watcher
 * paths. Auth is GitHub Actions OIDC (not MCP OAuth, not a Bee bearer in the
 * Action). The relay proxies through the private-CA bridge using the operator's
 * captured grant resolved via actions-grant sidecar.
 */

import { getContainer } from "@cloudflare/containers";
import { resolveActionsGrant } from "./actions-grant";
import { bearerOf, verifyActionsOidc } from "./actions-oidc";
import { beeRead } from "./bee";
import type { Env } from "./types";

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

/** True when this request targets an Actions-readable Bee path. */
export function isActionsReadPath(pathname: string): boolean {
  if (pathname === "/v1/changes") return true;
  return /^\/v1\/conversations\/[^/]+$/.test(pathname);
}

/** Serve GET /v1/changes or GET /v1/conversations/:id for verified Actions OIDC. */
export async function handleActionsRead(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const url = new URL(request.url);
  if (!isActionsReadPath(url.pathname)) {
    return new Response("Not found", { status: 404 });
  }

  const bearer = bearerOf(request.headers.get("Authorization"));
  if (!bearer) return jsonError(401, "missing_bearer");

  const identity = await verifyActionsOidc(bearer, env, request.url);
  if (!identity) return jsonError(403, "oidc_not_accepted");

  const beeToken = await resolveActionsGrant(env.OAUTH_KV, identity.login, env.GITHUB_CLIENT_SECRET);
  if (!beeToken) {
    return jsonError(403, "no_captured_grant");
  }

  const stub = getContainer(env.BEE_BRIDGE);
  const path = `${url.pathname}${url.search}`;
  const result = await beeRead(beeToken, stub, path);

  if (!result.ok) {
    const status = result.status && result.status >= 400 ? result.status : 502;
    return jsonError(status, "bee_read_failed");
  }

  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
