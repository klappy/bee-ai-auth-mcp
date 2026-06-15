/**
 * Default handler: everything that isn't the gated /mcp API.
 *
 * Model A (self-host): GitHub OAuth authenticates the operator to THIS relay.
 * There is NO Bee-token capture here — the Bee credential is the deployer's
 * own Worker secret (BEE_API_TOKEN). The GitHub user token is used for one
 * GET (/user) to read the login, then discarded; never stored, logged, or
 * returned.
 *
 * Flow:
 *   /authorize — MCP client arrives; parse the request, bounce to GitHub login.
 *   /callback  — GitHub returns; exchange code for a transient user token,
 *                read the login, allow-list check, bind the grant.
 */

import type { AuthRequest } from "@cloudflare/workers-oauth-provider";
import { encodeState, decodeState } from "./state";
import type { Env } from "./types";
import { COMMIT_SHA } from "./version";

const GH = "https://api.github.com";
const UA = "bee-ai-auth-mcp";

function html(body: string, status = 200): Response {
  return new Response(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>bee-ai-auth-mcp</title><style>body{font-family:ui-monospace,monospace;background:#FAFAF6;color:#16201B;max-width:560px;margin:64px auto;padding:0 20px;line-height:1.6}a{color:#0E5A4A}</style></head><body>${body}</body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

/** Comma-separated allow-list; self-host denies by default until configured. */
function isAllowed(login: string, env: Env): boolean {
  const list = (env.ALLOWED_GITHUB_LOGIN ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(login.toLowerCase());
}

export const BeeAuthHandler = {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/healthz") return new Response("ok", { status: 200 });

    // Commit SHA baked into this immutable version's bundle at build time
    // (scripts/gen-version.mjs), so CI can confirm this preview is the commit
    // under test. Per-version by construction — no shared/mutable deploy var.
    if (url.pathname === "/version") return new Response(COMMIT_SHA, { status: 200 });

    // ---- MCP client begins authorization ----
    if (url.pathname === "/authorize") {
      let oauthReqInfo: AuthRequest;
      try {
        oauthReqInfo = await env.OAUTH_PROVIDER.parseAuthRequest(request);
      } catch (err) {
        return html(
          `<h2>Invalid authorization request</h2><p>${
            err instanceof Error ? err.message : "Malformed request."
          }</p><p>MCP clients should register via <code>/register</code> and retry.</p>`,
          400
        );
      }
      if (!(await env.OAUTH_PROVIDER.lookupClient(oauthReqInfo.clientId))) {
        return html(`<h2>Unknown client</h2><p>Register via <code>/register</code> first.</p>`, 400);
      }
      const gh = new URL("https://github.com/login/oauth/authorize");
      gh.searchParams.set("client_id", env.GITHUB_CLIENT_ID);
      gh.searchParams.set("redirect_uri", `${url.origin}/callback`);
      gh.searchParams.set("state", encodeState(oauthReqInfo));
      return Response.redirect(gh.toString(), 302);
    }

    // ---- GitHub returns with identity ----
    if (url.pathname === "/callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      if (!code || !state) return html(`<h2>Missing code or state.</h2>`, 400);
      const oauthReqInfo = decodeState<AuthRequest>(state);

      // Exchange for a transient user token (used once, then discarded).
      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json", "user-agent": UA },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: `${url.origin}/callback`,
        }),
      });
      const tokenJson = (await tokenRes.json()) as { access_token?: string; error?: string };
      if (!tokenJson.access_token) {
        return html(`<h2>GitHub login failed.</h2><p>${tokenJson.error ?? "no token returned"}</p>`, 400);
      }

      const userRes = await fetch(`${GH}/user`, {
        headers: {
          authorization: `Bearer ${tokenJson.access_token}`,
          accept: "application/vnd.github+json",
          "user-agent": UA,
        },
      });
      if (!userRes.ok) return html(`<h2>Could not read GitHub identity.</h2>`, 400);
      const user = (await userRes.json()) as { login: string };

      if (!isAllowed(user.login, env)) {
        return html(
          `<h2>Not authorized</h2><p>Signed in as <b>${user.login}</b>, but this self-host instance only allows its configured operator(s). Set <code>ALLOWED_GITHUB_LOGIN</code> and reconnect.</p>`,
          403
        );
      }

      const { redirectTo } = await env.OAUTH_PROVIDER.completeAuthorization({
        request: oauthReqInfo,
        userId: user.login,
        metadata: { label: user.login },
        scope: ["bee_read"],
        props: { login: user.login },
      });
      return Response.redirect(redirectTo, 302);
    }

    return new Response("Not found", { status: 404 });
  },
};
