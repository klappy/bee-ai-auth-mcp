import { embeddedAssets } from './embedded-assets';
import { verifyAccessJwt } from './access';
import { privatePage } from './signup';
import type { Env } from './types';

/** Prelaunch review copy. Never imported by the production entry or public asset map. */
const HOMEPAGE_DRAFT = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Your Bee, connected — a klappy.dev service</title>
<meta name="description" content="Connect your own Bee to your AI app. Verify your email, approve in Bee, and start with a monthly free allowance." />
<meta property="og:type" content="website" />
<meta property="og:title" content="Your Bee, connected" />
<meta property="og:description" content="Your Bee conversations, in the AI you already use." />
<meta property="og:url" content="https://bee.klappy.dev/" />
<meta property="og:image" content="https://bee.klappy.dev/og-image.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://bee.klappy.dev/og-image.png" />
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />
<link rel="icon" href="/favicon.ico" sizes="any" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
<meta name="theme-color" content="#0E5A4A" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
<link rel="stylesheet" href="/style.css" />
</head>
<body class="hosted-home">
<a class="skip-link" href="#main">Skip to setup</a>
<header><div class="wrap bar">
<a class="brand" href="/"><img src="/favicon.svg" width="28" height="28" alt="" /> Bee, connected</a>
<nav aria-label="Main"><a href="#connect">Connect</a><a href="#plans">Plans</a><a href="#help">Help</a></nav>
</div></header>
<main class="wrap" id="main">
<aside class="pair-help" aria-label="Draft status"><strong>Homepage draft — review only.</strong> This describes the intended launch experience. Immediate free access and paid upgrades are not enabled yet.</aside>
<section class="hero flush">
<img class="bee-mark" src="/favicon.svg" width="76" height="76" alt="" />
<p class="eyebrow">Hosted by Klappy</p>
<h1>Your Bee, <span class="hl">in the AI you already use.</span></h1>
<p class="lede">Bring conversations your Bee captured into your AI app. Verify your email, connect <strong>your own Bee</strong>, and start with free usage that renews each month.</p>
<div class="endpoint-box">
<label for="mcp-url">Your connector URL</label>
<div class="endpoint-row"><input id="mcp-url" type="url" value="https://bee.klappy.dev/mcp" readonly spellcheck="false" /><button class="btn btn-primary" id="copy-url" type="button" hidden>Copy URL</button></div>
<p id="copy-status" role="status" aria-live="polite">Use this address when your AI app asks for a server URL.</p>
</div>
<a class="btn btn-ghost" href="#connect">Choose your AI app ↓</a>
</section>
<section id="before">
<p class="kicker">Before you start</p><h2>Three things to have ready.</h2>
<ul class="ready-list">
<li><strong>An inbox you can open.</strong> Sign in with the code emailed to you. No GitHub or Cloudflare account is required.</li>
<li><strong>An AI app that supports custom connectors.</strong> Availability depends on your app, plan and workspace settings.</li>
<li><strong>Your Bee app, signed in on your phone.</strong> You'll approve the connection there. You do not install or run Bee CLI. </li>
</ul>
</section>
<section id="connect">
<p class="kicker">1 · Choose your app</p><h2>Same URL. Your choice of AI.</h2>
<p>Start in your AI app's web version. Menu names and availability can vary by account; the official guides below cover the latest options.</p>
<div class="app-guides">
<details id="claude" open><summary>Claude <span>Custom connector</span></summary><div class="guide-body"><p>Add Bee as a custom connector using the URL above, then complete email sign-in and Bee approval. Enable Bee in the conversation where you want to use it.</p><p><a href="https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp">Claude's official connector guide ↗</a></p></div></details>
<details id="chatgpt"><summary>ChatGPT <span>OAuth connection</span></summary><div class="guide-body"><p>Create a custom app using the URL above and choose <strong>OAuth</strong>. Complete email sign-in and Bee approval, then select Bee in your conversation.</p><p><a href="https://developers.openai.com/api/docs/guides/developer-mode">OpenAI's official developer-mode guide ↗</a></p></div></details>
<details id="grok"><summary>Grok <span>Custom connector</span></summary><div class="guide-body"><p>If your account offers custom connectors, add the URL above and follow the authentication prompts. Complete email sign-in and Bee approval before asking your question.</p><p><a href="https://docs.x.ai/grok/connectors">Grok's official connector guide ↗</a></p></div></details>
</div>
<p class="small-note">These guides describe each platform's supported setup. They are not a promise that every account or device has been tested with this service.</p>
</section>
<section id="pair">
<p class="kicker">2 · Sign in &amp; pair</p><h2>Connect your Bee.</h2>
<div class="steps">
<div class="step"><div class="num">1</div><div><h3>Verify your email</h3><p>Enter your email, check your inbox, and enter the sign-in code. Then continue to connect your own Bee account.</p></div></div>
<div class="step"><div class="num">2</div><div><h3>Approve in your Bee app</h3><p>The hosted service runs Bee's official CLI and shows you the approval link or QR that CLI generates. On your phone, tap <strong>Open in the Bee app</strong>. On a computer, scan the QR with your Bee app. You do not install or run the CLI yourself. The Bee app may label the approval <strong>Bee CLI</strong>.</p></div></div>
<div class="step"><div class="num">3</div><div><h3>Return to your AI app</h3><p>After you approve, the hosted service finishes the connection. Complete any remaining prompts and enable Bee for your conversation. You don't need to paste a Bee token into chat.</p></div></div>
</div>
<p class="pair-help">If the scanner is missing, enable Developer Mode in the Bee app by tapping its app Version five times. The pairing screen also offers a connect URL for the Bee app's <strong>Enter Bee ID</strong> field. <a href="https://docs.bee.computer/docs/developer-mode">Bee's guide ↗</a></p>
</section>
<section id="try">
<p class="kicker">3 · Try it</p><h2>Start with one question.</h2>
<blockquote class="first-prompt">Use Bee to find my most recent conversation. Tell me when it happened and summarize its main points. If you can't access Bee, say so.</blockquote>
<p>A successful response uses Bee and identifies a conversation from your account. If it only gives general advice, ask it to use the Bee connector. No recordings yet? Try again after a conversation appears in your Bee app.</p>
</section>
<section id="plans">
<p class="kicker">Plans</p><h2>Start free. Upgrade when you need more.</h2>
<p>The connector brings your existing Bee account into your AI app. Bee hardware, Bee services and your AI app's subscription are separate.</p>
<div class="status">
<div class="row live"><div class="mark">1</div><div><div class="t">Free — renews monthly</div><div class="d">A monthly allowance for reading your Bee through the connector. Your usage view shows what remains and when it renews. If you reach the allowance, your connection stays intact; wait for renewal or choose Standard when upgrades are available.</div></div></div>
<div class="row"><div class="mark">2</div><div><div class="t">Standard</div><div class="d">For people who need more than the free allowance. Paid signup is not open yet; included usage will be shown before purchase.</div><ul class="ready-list"><li><strong>$5/month</strong></li><li><strong>$24/year</strong> — $2/month equivalent</li></ul></div></div>
</div>
</section>
<section id="privacy">
<p class="kicker">Your account · Your choice</p><h2>Know what you're connecting.</h2>
<p>This service can read your Bee conversations; it does not edit or delete them. Each connection uses the Bee account you approve, not Klappy's account.</p>
<p><strong>Klappy operates the hosted service.</strong> It holds your Bee credential in an encrypted connection grant and processes retrieved data on the way to your AI app. This means trusting Klappy and the hosting infrastructure with that access. Your AI provider receives the material you retrieve, subject to its own settings and policies.</p>
<p>Disconnect Bee in your AI app when you no longer want to use it there. That does not erase material already included in chats. For help removing hosted access or revoking Bee authorization, ask Klappy.</p>

</section>
<section id="help">
<p class="kicker">If something gets stuck</p><h2>A few quick fixes.</h2>
<div class="app-guides">
<details><summary>I can't sign in or haven't received a code</summary><div class="guide-body"><p>Check that you entered the right email and look in your spam folder for the sign-in code. If it still does not arrive, ask Klappy for help. You don't need to create a GitHub or Cloudflare account or change server settings.</p></div></details>
<details><summary>I can't find the connector option</summary><div class="guide-body"><p>Try the web version and check your app's guide above. Your plan or workspace permissions may restrict custom connections.</p></div></details>
<details><summary>The Bee link or QR code isn't working</summary><div class="guide-body"><p>Make sure Bee is installed and signed in. Try the pairing screen's connect URL in Bee's Enter Bee ID field, or restart the connection so the hosted service can generate a fresh CLI approval. Use the link or QR from your own sign-in.</p></div></details>
<details><summary>Connected, but Bee won't answer</summary><div class="guide-body"><p>Enable Bee in the conversation and try once more. If the error persists, tell Klappy which AI app you used and the error message. Keep Bee tokens, pairing codes and private conversation text out of screenshots.</p></div></details>
</div>
</section>
</main>
<footer><div class="wrap frow"><span>Bee · a klappy.dev service</span><a href="#privacy">Privacy &amp; access</a><a href="https://github.com/klappy/bee-ai-auth-mcp">Source · MIT</a></div></footer>
<script>
(() => {
  const field = document.getElementById('mcp-url');
  const button = document.getElementById('copy-url');
  const status = document.getElementById('copy-status');
  button.hidden = false;
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(field.value);
      status.textContent = 'Copied. Paste this URL into your AI app.';
    } catch {
      field.focus();
      field.select();
      status.textContent = 'Select and copy the URL above, then paste it into your AI app.';
    }
  });
})();
</script>
</body>
</html>
`;

export async function preview(request: Request, env: Env): Promise<Response> {
  if (!['GET', 'HEAD'].includes(request.method)) return privatePage('Method not allowed', 405);
  if (!(await verifyAccessJwt(request, env))) return privatePage('Email verification required', 403);
  const url = new URL(request.url); url.pathname = url.pathname.slice('/preview'.length) || '/';
  const headers = new Headers(request.headers); headers.delete('If-None-Match');
  const isDraftHome = ['/', '/index', '/index.html'].includes(url.pathname);
  const response = isDraftHome
    ? new Response(request.method === 'HEAD' ? null : HOMEPAGE_DRAFT, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    : await embeddedAssets.fetch(new Request(url, { method: request.method, headers }));
  const outHeaders = new Headers(response.headers);
  outHeaders.set('Cache-Control', 'private, no-store'); outHeaders.set('Referrer-Policy', 'no-referrer'); outHeaders.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  if (outHeaders.has('Location')) outHeaders.set('Location', '/preview' + outHeaders.get('Location'));
  if (response.status === 200 && request.method === 'GET' && outHeaders.get('Content-Type')?.includes('text/html')) {
    let body = (await response.text()).replaceAll('https://bee.klappy.dev', url.origin);
    // Draft and existing local assets stay under the verified preview namespace.
    body = body.replace(/(href|src)=(['"])\/(?!\/)([^'"\s]*)\2/g, (_m, attr, quote, path) => `${attr}=${quote}/preview/${path}${quote}`);
    body = body.replace('<head>', '<head><base href="/preview/">');
    outHeaders.delete('Content-Length'); outHeaders.delete('ETag');
    return new Response(body, { status: response.status, headers: outHeaders });
  }
  return new Response(response.body, { status: response.status, headers: outHeaders });
}

