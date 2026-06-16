/**
 * Default handler: everything that isn't the gated /mcp API.
 *
 * v0.3 per-grant custody (ledger E0012): GitHub OAuth authenticates the operator
 * to THIS relay (the user<->relay leg) and gates tenancy via the allow-list.
 * Then — unlike the old Model-A design — we CAPTURE the operator's Bee token at
 * a consent step and bind it into THEIR encrypted grant props. There is no
 * shared BEE_API_TOKEN Worker secret. The GitHub user token is used for one
 * GET (/user) to read the login, then discarded; never stored, logged, returned.
 *
 * Flow:
 *   /authorize — MCP client arrives; parse the request, bounce to GitHub login.
 *   /callback  — GitHub returns; exchange code for a transient user token, read
 *                the login, allow-list check, then render the Bee-token consent
 *                form (carrying a signed {oauthReqInfo, login}).
 *   /consent   — (POST) verify the signed state, validate the pasted Bee token
 *                via GET /v1/me through the bridge, then completeAuthorization
 *                binding { login, beeToken } into encrypted props.
 */

import type { AuthRequest } from "@cloudflare/workers-oauth-provider";
import { getContainer } from "@cloudflare/containers";
import { encodeState, decodeState, signConsent, verifyConsent } from "./state";
import { beeGetMe } from "./bee";
import type { Env } from "./types";
import { COMMIT_SHA } from "./version";

const GH = "https://api.github.com";
const UA = "bee-ai-auth-mcp";

/** Where a Bee owner finds their token (shown on the consent screen). */
const BEE_TOKEN_HELP = "https://docs.bee.computer/docs/developer-mode";

function html(body: string, status = 200): Response {
  return new Response(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>bee-ai-auth-mcp</title><style>body{font-family:ui-monospace,monospace;background:#FAFAF6;color:#16201B;max-width:560px;margin:64px auto;padding:0 20px;line-height:1.6}a{color:#0E5A4A}input[type=password]{width:100%;box-sizing:border-box;padding:10px;font:inherit;border:1px solid #16201B;border-radius:6px;margin:8px 0}button{padding:10px 18px;font:inherit;background:#0E5A4A;color:#FAFAF6;border:0;border-radius:6px;cursor:pointer}.err{color:#9B2226}</style></head><body>${body}</body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

/** The Bee-token consent form. `signed` round-trips the gate-verified identity. */
function consentForm(login: string, signed: string, error?: string): Response {
  return html(
    `<h2>Connect your Bee</h2>
     <p>Signed in as <b>${login}</b>. Paste your <b>Bee API token</b> to authorize this relay
        to read your Bee on your behalf. It is stored only inside your own encrypted grant —
        never shown to the AI client, never logged.</p>
     ${error ? `<p class="err">${error}</p>` : ""}
     <form method="POST" action="/consent" autocomplete="off">
       <input type="hidden" name="s" value="${signed}">
       <input type="password" name="bee_token" placeholder="Bee API token" autocomplete="off" autofocus>
       <button type="submit">Authorize</button>
     </form>
     <p style="font-size:0.9em"><b>How do I get my Bee token?</b></p>
     <ol style="font-size:0.9em;padding-left:1.2em">
       <li>In the <b>Bee iOS app</b>, open Settings and tap the app <b>Version 5 times</b> to turn on Developer Mode (<a href="${BEE_TOKEN_HELP}" target="_blank" rel="noopener">Bee's guide</a>).</li>
       <li>On a computer with Node, run <code>npm i -g @beeai/cli</code>, then <code>bee login --qr</code>, and approve the scan in your Bee app.</li>
       <li>Print your token — macOS Keychain: <code>security find-generic-password -s bee-cli -a token:prod -w</code>; or file store: <code>cat ~/.bee/token-prod</code>.</li>
       <li>Paste it above and choose Authorize.</li>
     </ol>
     <p style="font-size:0.85em">Full walkthrough: <a href="/setup">setup guide</a>. A one-tap in-app QR pairing is planned so this won't need a computer (pending Bee app registration). To revoke: disconnect here to delete this copy, then re-pair or rotate in the Bee app.</p>`,
    error ? 400 : 200
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

interface ConsentState {
  req: AuthRequest;
  login: string;
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

      // Identity proven + allow-listed. Carry it (signed) to the consent step;
      // the GitHub token is now discarded. No Bee token exists yet.
      const signed = await signConsent(
        { req: oauthReqInfo, login: user.login } satisfies ConsentState,
        env.GITHUB_CLIENT_SECRET
      );
      return consentForm(user.login, signed);
    }

    // ---- Bee-token consent (capture into encrypted props) ----
    if (url.pathname === "/consent" && request.method === "POST") {
      const form = await request.formData();
      const signed = String(form.get("s") ?? "");
      const beeToken = String(form.get("bee_token") ?? "").trim();

      const cs = await verifyConsent<ConsentState>(signed, env.GITHUB_CLIENT_SECRET);
      if (!cs || !cs.login || !cs.req) {
        return html(`<h2>Consent state invalid or tampered.</h2><p>Restart the connection from your client.</p>`, 400);
      }

      // Defense in depth: re-check the allow-list against the signed login.
      if (!isAllowed(cs.login, env)) {
        return html(`<h2>Not authorized</h2><p><b>${cs.login}</b> is not on this instance's allow-list.</p>`, 403);
      }

      if (!beeToken) {
        return consentForm(cs.login, signed, "Please paste your Bee API token.");
      }

      // Validate the token before binding it — a bad token must not become a
      // confusing post-connect failure. This is the first real call through the
      // private-CA bridge container; a transport error here means it isn't ready.
      const stub = getContainer(env.BEE_BRIDGE); // shared singleton; never per-user (E0014)
      const check = await beeGetMe(beeToken, stub);
      if (!check.ok) {
        return consentForm(cs.login, signed, `Bee did not accept that: ${check.message}`);
      }

      // Bind identity + Bee token into the user's encrypted grant props.
      const { redirectTo } = await env.OAUTH_PROVIDER.completeAuthorization({
        request: cs.req,
        userId: cs.login,
        metadata: { label: cs.login },
        scope: ["bee_read"],
        props: { login: cs.login, beeToken },
      });
      return Response.redirect(redirectTo, 302);
    }

    return new Response("Not found", { status: 404 });
  },
};
