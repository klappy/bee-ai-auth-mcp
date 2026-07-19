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
 *   /pairing/start  — (POST, page JS) verify the signed state, mint an ephemeral
 *                x25519 keypair, create the Bee pairing request, return the QR
 *                + a sealed (AES-GCM) blob carrying the keypair client-side.
 *   /pairing/status — (POST, page JS) verify signed state + sealed blob, re-POST
 *                the same publicKey (the pairing service polls idempotently);
 *                on approval decrypt the boxed token and join the paste path:
 *                same bridge validation, same completeAuthorization. See
 *                src/pairing.ts for protocol facts and custody rationale.
 */

import type { AuthRequest } from "@cloudflare/workers-oauth-provider";
import { getContainer } from "@cloudflare/containers";
import { renderSVG } from "uqr";
import { encodeState, decodeState, signConsent, verifyConsent } from "./state";
import { beeGetMe } from "./bee";
import {
  b64ToBytes,
  buildConnectUrl,
  bytesToB64,
  generatePairingKeyPair,
  openPairingEnvelope,
  postPairing,
  sealPairingState,
  unsealPairingState,
} from "./pairing";
import type { Env } from "./types";
import { COMMIT_SHA } from "./version";

const GH = "https://api.github.com";
const UA = "bee-ai-auth-mcp";

/** Where a Bee owner finds their token (shown on the consent screen). */
const BEE_TOKEN_HELP = "https://docs.bee.computer/docs/developer-mode";

function html(body: string, status = 200): Response {
  return new Response(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>bee-ai-auth-mcp</title><style>body{font-family:ui-monospace,monospace;background:#FAFAF6;color:#16201B;max-width:560px;margin:64px auto;padding:0 20px;line-height:1.6}a{color:#0E5A4A}input[type=password],input[type=text]{width:100%;box-sizing:border-box;padding:10px;font:inherit;border:1px solid #16201B;border-radius:6px;margin:8px 0}button{padding:10px 18px;font:inherit;background:#0E5A4A;color:#FAFAF6;border:0;border-radius:6px;cursor:pointer}.err{color:#9B2226}#qr-box{margin:12px 0}#qr-box svg{width:220px;height:auto;display:block;border:1px solid #d8d8d0;border-radius:8px}#or{display:flex;align-items:center;gap:10px;color:#5b6660;margin:20px 0}#or:before,#or:after{content:"";flex:1;border-top:1px solid #d8d8d0}details{font-size:0.9em;margin:12px 0}.btn-hero{display:block;text-align:center;padding:16px 18px;font:inherit;font-weight:bold;font-size:1.05em;background:#0E5A4A;color:#FAFAF6;border-radius:8px;text-decoration:none;margin:8px 0}#connect-url-pane{margin:16px 0}#connect-url-pane div{display:flex;gap:8px}#connect-url-pane input{margin:4px 0}</style></head><body>${body}</body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } }
  );
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/** Mobile/touch UA heuristic: on-device Bee app deep-link becomes viable, so
 *  the approve CTA outranks the QR (a phone can't usefully scan its own screen). */
export function isMobileUA(request: Request): boolean {
  if (request.headers.get("sec-ch-ua-mobile") === "?1") return true;
  const ua = request.headers.get("user-agent") ?? "";
  return /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
}

/** The Bee-token consent screen: QR pairing headline, paste fallback.
 *  `signed` round-trips the gate-verified identity through both paths.
 *  `isMobile` reorders the pairing CTAs: on touch devices the "Open in the
 *  Bee app" deep-link is the primary action (a phone can't scan its own QR
 *  code); on desktop the QR stays primary since there's no local Bee app. */
export function consentForm(login: string, signed: string, isMobile: boolean, error?: string): Response {
  const connectUrlPane = `<div id="connect-url-pane" style="display:none">
       <p style="font-size:0.85em;margin:12px 0 4px">Or enter this in the Bee app's <b>Enter Bee ID</b> field:</p>
       <div><input id="connect-url-text" type="text" readonly><button id="copy-connect-url" type="button">Copy</button></div>
     </div>`;
  const ctaPane = isMobile
    ? `<div id="cta-pane">
         <a id="approve-btn" class="btn-hero" href="#" style="display:none" target="_blank" rel="noopener">Open in the Bee app</a>
         <p id="qr-status">Getting a pairing code…</p>
         <details id="qr-details">
           <summary>Or scan a QR code</summary>
           <div id="qr-box"></div>
         </details>
       </div>`
    : `<div id="cta-pane">
         <p id="qr-status">Getting a pairing code…</p>
         <div id="qr-box"></div>
         <p id="qr-link" style="font-size:0.9em"></p>
       </div>`;
  return html(
    `<h2>Connect your Bee</h2>
     <p>Signed in as <b>${login}</b>. Authorize this relay to read your Bee on your behalf.
        Your Bee token is stored only inside your own encrypted grant —
        never shown to the AI client, never logged.</p>
     ${error ? `<p class="err">${error}</p>` : ""}
     ${ctaPane}
     ${connectUrlPane}
     <p style="font-size:0.8em;color:#5b6660">Heads-up: the Bee app shows this approval as the
        <b>Bee CLI</b> — the relay borrows the CLI's app registration (fine for self-hosting;
        details in the <a href="/setup">setup guide</a>).</p>
     <div id="or">or paste a token</div>
     <form method="POST" action="/consent" autocomplete="off">
       <input type="hidden" name="s" value="${signed}">
       <input type="password" name="bee_token" placeholder="Bee API token" autocomplete="off">
       <button type="submit">Authorize</button>
     </form>
     <details><summary><b>How do I get my Bee token by hand?</b></summary>
     <ol style="padding-left:1.2em">
       <li>In the <b>Bee iOS app</b>, open Settings and tap the app <b>Version 5 times</b> to turn on Developer Mode (<a href="${BEE_TOKEN_HELP}" target="_blank" rel="noopener">Bee's guide</a>).</li>
       <li>On a computer with Node, run <code>npm i -g @beeai/cli</code>, then <code>bee login --qr</code>, and approve the scan in your Bee app.</li>
       <li>Print your token — macOS Keychain: <code>security find-generic-password -s bee-cli -a token:prod -w</code>; or file store: <code>cat ~/.bee/token-prod</code>.</li>
       <li>Paste it above and choose Authorize.</li>
     </ol></details>
     <p style="font-size:0.85em">Full walkthrough: <a href="/setup">setup guide</a>. To revoke: disconnect here to delete this copy, then re-pair or rotate in the Bee app.</p>
     <script>
     (function () {
       var isMobile = ${isMobile ? "true" : "false"};
       var s = document.querySelector('input[name="s"]').value;
       var statusEl = document.getElementById('qr-status');
       var boxEl = document.getElementById('qr-box');
       var linkEl = document.getElementById('qr-link');
       var approveBtn = document.getElementById('approve-btn');
       var connectUrlPane = document.getElementById('connect-url-pane');
       var connectUrlText = document.getElementById('connect-url-text');
       var copyBtn = document.getElementById('copy-connect-url');
       if (copyBtn && connectUrlText) copyBtn.addEventListener('click', function () {
         connectUrlText.focus(); connectUrlText.select();
         function done() { copyBtn.textContent = 'Copied!'; setTimeout(function () { copyBtn.textContent = 'Copy'; }, 1500); }
         if (navigator.clipboard && navigator.clipboard.writeText) {
           navigator.clipboard.writeText(connectUrlText.value).then(done, function () { try { document.execCommand('copy'); } catch (e) {} done(); });
         } else {
           try { document.execCommand('copy'); } catch (e) {}
           done();
         }
       });
      var p = null, expiresAt = 0, attempt = 0, done = false, timer = null, polling = false, gen = 0;
      function post(path, body) {
         return fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
           .then(function (r) { return r.json(); });
       }
       function retryLink(msg) {
         statusEl.innerHTML = msg + ' <a href="#" id="qr-retry">Get a new code</a> — or paste your token below.';
         var r = document.getElementById('qr-retry');
         if (r) r.addEventListener('click', function (e) { e.preventDefault(); start(); });
       }
      function start() {
        if (timer) { clearTimeout(timer); timer = null; }
        // Bump the generation so any in-flight start/poll from an earlier tap
        // resolves into a stale run and is ignored — otherwise a slow response
        // could overwrite p/qrSvg/connectUrl for a keypair the page no longer shows.
        var myGen = ++gen;
        attempt = 0; done = false; polling = false; boxEl.innerHTML = ''; if (linkEl) linkEl.innerHTML = '';
         statusEl.textContent = 'Getting a pairing code…';
         post('/pairing/start', { s: s }).then(function (d) {
           if (myGen !== gen) return;
           if (d.status !== 'pending') { retryLink(d.message || 'Could not start pairing.'); return; }
           p = d.p;
           expiresAt = Date.parse(d.expiresAt) || (Date.now() + 5 * 60 * 1000);
           boxEl.innerHTML = d.qrSvg;
           if (linkEl) linkEl.innerHTML = 'On this phone already? <a href="' + d.connectUrl + '" target="_blank" rel="noopener">Open in the Bee app</a>, approve, then come back to this tab.';
           if (approveBtn) { approveBtn.href = d.connectUrl; approveBtn.style.display = ''; }
           if (connectUrlText && connectUrlPane) { connectUrlText.value = d.connectUrl; connectUrlPane.style.display = ''; }
           statusEl.textContent = isMobile
             ? 'Tap "Open in the Bee app" above to approve — this page finishes by itself.'
             : 'Scan with your phone camera and approve in the Bee app — this page finishes by itself.';
           schedule(myGen);
         }).catch(function () { if (myGen !== gen) return; retryLink('Could not reach the relay.'); });
       }
       function schedule(myGen) {
         if (done || myGen !== gen) return;
         if (Date.now() >= expiresAt) { boxEl.innerHTML = ''; retryLink('That code expired.'); return; }
        attempt++;
        // Steady 3s early, then doubling, capped at the CLI's 30s MAX_BACKOFF.
        var delay = Math.min(3000 * Math.pow(2, Math.max(0, attempt - 4)), 30000);
        timer = setTimeout(function () { poll(myGen); }, delay);
      }
      function poll(myGen) {
        // Guard against overlapping in-flight polls so two responses can't both
        // observe 'completed' and race a duplicate finish, and drop polls left
        // over from a superseded generation.
        if (done || polling || myGen !== gen) return;
        polling = true;
        post('/pairing/status', { s: s, p: p }).then(function (d) {
          polling = false;
          // 'completed' means the server already ran completeAuthorization and
          // consumed this single-use request, so honor the redirect even if a
          // newer generation (a fresh "Get a new code") superseded this poll —
          // otherwise the OAuth redirect the MCP client is waiting for is lost.
          // Only done (a completion path already took over) suppresses it.
          if (d.status === 'completed') {
             if (done) return;
             if (!d.redirectTo) { retryLink(d.message || 'Pairing finished but no sign-in link was returned.'); return; }
             done = true;
             statusEl.textContent = 'Paired! Finishing sign-in…';
             var f = document.querySelector('form[action="/consent"]');
             if (f) { f.querySelector('button').disabled = true; f.querySelector('input[name="bee_token"]').disabled = true; }
             location.assign(d.redirectTo);
             return;
           }
           if (done || myGen !== gen) return;
           if (d.status === 'expired') { boxEl.innerHTML = ''; retryLink('That code expired.'); return; }
           if (d.status === 'pending') { schedule(myGen); return; }
          retryLink(d.message || 'Pairing failed.');
        }).catch(function () { polling = false; if (myGen !== gen) return; schedule(myGen); }); // transient network blip: keep polling inside the expiry window
       }
       var pasteForm = document.querySelector('form[action="/consent"]');
       if (pasteForm) pasteForm.addEventListener('submit', function () {
         // The paste path is taking over this single-use authorization request:
         // stop QR polling and bump the generation so no in-flight or scheduled
         // poll can also reach completeAuthorization. Mirrors how a completed QR
         // disables this form — the two completion paths never run concurrently.
         done = true; gen++;
         if (timer) { clearTimeout(timer); timer = null; }
       });
       start();
     })();
     </script>`,
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
      return consentForm(user.login, signed, isMobileUA(request));
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
        return consentForm(cs.login, signed, isMobileUA(request), "Please paste your Bee API token.");
      }

      // Validate the token before binding it — a bad token must not become a
      // confusing post-connect failure. This is the first real call through the
      // private-CA bridge container; a transport error here means it isn't ready.
      const stub = getContainer(env.BEE_BRIDGE); // shared singleton; never per-user (E0014)
      const check = await beeGetMe(beeToken, stub);
      if (!check.ok) {
        return consentForm(cs.login, signed, isMobileUA(request), `Bee did not accept that: ${check.message}`);
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

    // ---- QR pairing: start (called by the consent page's JS) ----
    // Generates the ephemeral x25519 keypair in-Worker and creates the pairing
    // request. The keypair leaves this invocation only inside `p`, an
    // AES-GCM-sealed blob the page carries back on every poll — the Worker
    // holds no pairing state and the browser holds only ciphertext.
    if (url.pathname === "/pairing/start" && request.method === "POST") {
      const body = await readJson(request);
      const cs = await verifyConsent<ConsentState>(str(body?.["s"]), env.GITHUB_CLIENT_SECRET);
      if (!cs || !cs.login || !cs.req) {
        return json({ status: "error", message: "Consent state invalid — restart the connection from your client." }, 400);
      }
      if (!isAllowed(cs.login, env)) {
        return json({ status: "error", message: "Not authorized." }, 403);
      }

      const kp = generatePairingKeyPair();
      const outcome = await postPairing(kp.publicKeyB64);
      if (outcome.status !== "pending") {
        // A fresh keypair can only be answered "pending" — anything else is a
        // service-side failure worth surfacing verbatim (status only, no material).
        const message = outcome.status === "error" ? outcome.message : "Pairing request failed — try again.";
        return json({ status: "error", message }, 502);
      }

      const sealed = await sealPairingState(
        {
          pk: kp.publicKeyB64,
          sk: bytesToB64(kp.secretKey),
          requestId: outcome.requestId,
          login: cs.login,
          clientId: cs.req.clientId,
          iat: Date.now(),
        },
        env.GITHUB_CLIENT_SECRET
      );
      const connectUrl = buildConnectUrl(outcome.requestId);
      return json({
        status: "pending",
        requestId: outcome.requestId,
        expiresAt: outcome.expiresAt,
        connectUrl,
        qrSvg: renderSVG(connectUrl, { border: 2 }),
        p: sealed,
      });
    }

    // ---- QR pairing: poll (idempotent re-POST of the same publicKey) ----
    if (url.pathname === "/pairing/status" && request.method === "POST") {
      const body = await readJson(request);
      const cs = await verifyConsent<ConsentState>(str(body?.["s"]), env.GITHUB_CLIENT_SECRET);
      if (!cs || !cs.login || !cs.req) {
        return json({ status: "error", message: "Consent state invalid — restart the connection from your client." }, 400);
      }
      if (!isAllowed(cs.login, env)) {
        return json({ status: "error", message: "Not authorized." }, 403);
      }
      const st = await unsealPairingState(str(body?.["p"]), env.GITHUB_CLIENT_SECRET);
      if (!st || st.login !== cs.login || st.clientId !== cs.req.clientId) {
        return json({ status: "error", message: "Pairing state invalid or stale — get a new code." }, 400);
      }

      const outcome = await postPairing(st.pk);
      if (outcome.status === "pending") return json({ status: "pending", expiresAt: outcome.expiresAt });
      if (outcome.status === "expired") return json({ status: "expired" });
      if (outcome.status === "error") return json({ status: "error", message: outcome.message }, 502);

      // Completed: decrypt to OUR ephemeral key, then follow the paste path
      // exactly — bridge validation first, then the same grant write. A bad
      // decrypt or a bad token can never become a grant.
      const beeToken = openPairingEnvelope(outcome.encryptedToken, b64ToBytes(st.sk));
      if (!beeToken) {
        return json({ status: "error", message: "Could not decrypt the pairing response — get a new code." }, 400);
      }

      const stub = getContainer(env.BEE_BRIDGE); // shared singleton; never per-user (E0014)
      const check = await beeGetMe(beeToken, stub);
      if (!check.ok) {
        return json({ status: "error", message: `Bee did not accept the paired token: ${check.message}` }, 400);
      }

      const { redirectTo } = await env.OAUTH_PROVIDER.completeAuthorization({
        request: cs.req,
        userId: cs.login,
        metadata: { label: cs.login },
        scope: ["bee_read"],
        props: { login: cs.login, beeToken },
      });
      return json({ status: "completed", redirectTo });
    }

    return new Response("Not found", { status: 404 });
  },
};
