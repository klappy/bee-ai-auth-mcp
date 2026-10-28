import { isStaging } from './types';
import { verifyAccessJwt } from './access';
import { admissionRecord, admissionStub, enrollVerified, normalizeEmail, type AdmissionRecord } from './admission';
import { eligible, ownUsage, quotaPolicy } from './quota';
import { signConsent, verifyConsent } from './state';
import type { Env } from './types';

export const escapeHtml = (s: string): string => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
export function privatePage(body: string, status = 200, referrerPolicy: 'no-referrer' | 'same-origin' = 'no-referrer'): Response {
  return new Response(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bee</title><main>${body}</main>`, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'Referrer-Policy': referrerPolicy, 'X-Robots-Tag': 'noindex, nofollow, noarchive', 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'" } });
}
export async function boundedBody(request: Request, limit = 16_384): Promise<string | null> {
  if (!request.body) return '';
  const reader = request.body.getReader(); const parts: Uint8Array[] = []; let size = 0;
  while (true) { const chunk = await reader.read(); if (chunk.done) break; size += chunk.value.length; if (size > limit) { await reader.cancel(); return null; } parts.push(chunk.value); }
  const bytes = new Uint8Array(size); let offset = 0; for (const part of parts) { bytes.set(part, offset); offset += part.length; }
  return new TextDecoder().decode(bytes);
}
export async function ownerIdentity(request: Request, env: Env): Promise<{ email: string } | null> {
  const audience = isStaging(env) ? env.STAGING_PREVIEW_AUD : env.ADMIN_ACCESS_AUD;
  const owner = isStaging(env) ? env.STAGING_OWNER_EMAIL : env.ADMIN_OWNER_EMAIL;
  if (!audience || !owner) return null;
  const identity = await verifyAccessJwt(request, { ...env, ACCESS_AUD: audience });
  return identity && normalizeEmail(identity.email) === normalizeEmail(owner) ? identity : null;
}
export async function pendingPage(env: Env, email: string, request?: Request): Promise<Response> {
  const record = await admissionRecord(env, email, true);
  if (!record) return privatePage('<h1>Request capacity reached</h1><p>Please try later.</p>', 429);
  let retry = '';
  if (request) {
    const url = new URL(request.url);
    const token = await signConsent({ login: normalizeEmail(email), returnPath: '/authorize/email' + url.search }, env.CONSENT_SIGNING_SECRET);
    retry = `<p><a href="/signup/retry?s=${encodeURIComponent(token)}">Check approval and continue</a></p>`;
  }
  return privatePage(`<h1>${record.status === 'denied' ? 'Access not approved' : 'Approval pending'}</h1><p>Your email is verified. Bee connection and data access remain unavailable until the owner approves your request.</p>${retry}<p><a href="/signup">View signup status</a></p>`, record.status === 'denied' ? 403 : 202);
}
export async function signupHandler(request: Request, env: Env): Promise<Response | null> {
  const url = new URL(request.url);
  const instructions = isStaging(env) ? '/preview/' : '/';
  if (url.pathname === '/') return privatePage(quotaPolicy(env) && quotaPolicy(env) !== 'invalid' ? '<h1>Bee staging</h1><p>Verify your email, then connect your own Bee account.</p><p><a href="/signup">Continue with email</a></p>' : '<h1>Bee staging</h1><p>Verify your email to request access. The owner approves requests before Bee connection or data access.</p><p><a href="/signup">Request access</a></p>');
  if (url.pathname.startsWith('/admin')) {
    const owner = await ownerIdentity(request, env);
    if (!owner) return privatePage('<h1>Owner access required</h1>', 403);
    const stub = admissionStub(env);
    if (url.pathname === '/admin/decision' && request.method === 'POST') {
      if (request.headers.get('Origin') !== url.origin || !request.headers.get('Content-Type')?.startsWith('application/x-www-form-urlencoded')) return privatePage('Invalid request', 403);
      const body = await boundedBody(request); if (body === null) return privatePage('Request too large', 413);
      const form = new URLSearchParams(body);
      const accepted = await stub.admission('decision', { email: owner.email, id: form.get('id') ?? '', status: form.get('status') ?? '', nonce: form.get('nonce') ?? '' });
      return accepted ? new Response(null, { status: 303, headers: { Location: '/admin', 'Cache-Control': 'no-store' } }) : privatePage('Invalid or expired action. Reload the request list.', 409);
    }
    if (url.pathname !== '/admin' || request.method !== 'GET') return privatePage('Not found', 404);
    const records = await stub.admission('list', {}) as AdmissionRecord[];
    const nonces = await stub.admission('nonce', { email: owner.email }) as Record<string, string>;
    return privatePage(`<h1>Access requests</h1><p>${isStaging(env) ? 'Approval enables a Bee connection during the bounded test window.' : 'Approval enables a Bee connection.'} Denial immediately blocks subsequent token exchanges and data requests; it does not claim to revoke an upstream Bee credential.</p>${records.map(r => `<section><p>${escapeHtml(r.email)} — ${r.status}</p>${['approved', 'denied'].map(status => `<form method="POST" action="/admin/decision"><input type="hidden" name="id" value="${r.id}"><input type="hidden" name="nonce" value="${nonces[`${r.id}:${status}`]}"><input type="hidden" name="status" value="${status}"><button>${status === 'approved' ? 'Approve' : 'Deny'}</button></form>`).join('')}</section>`).join('') || '<p>No requests.</p>'}`, 200, 'same-origin');
  }
  if (url.pathname === '/signup/retry') {
    const identity = await verifyAccessJwt(request, env); if (!identity) return privatePage('Email verification required', 403);
    const state = await verifyConsent<{ login: string; returnPath: string }>(url.searchParams.get('s') ?? '', env.CONSENT_SIGNING_SECRET);
    if (!state || state.login !== normalizeEmail(identity.email) || !state.returnPath.startsWith('/authorize/email?')) return privatePage('Connection request expired. Restart from your MCP client.', 400);
    return new Response(null, { status: 303, headers: { Location: state.returnPath, 'Cache-Control': 'no-store' } });
  }
  if (url.pathname === '/signup') {
    if (request.method !== 'GET') return privatePage('Method not allowed', 405);
    const identity = await verifyAccessJwt(request, env); if (!identity) return privatePage('Email verification required', 403);
    const policy = quotaPolicy(env);
    if (policy === 'invalid') return privatePage('Self-service is not configured.', 503);
    const record = await enrollVerified(env, identity.email); if (!record) return privatePage('Request capacity reached', 429);
    if (policy && eligible(record, policy)) {
      const usage = await ownUsage(env, identity.email, record.epoch);
      return privatePage(`<h1>Connect your Bee</h1><p>Add this MCP URL in your client and authorize your own Bee account.</p><p><label>MCP URL <input readonly value="${escapeHtml(url.origin + '/mcp')}"></label></p><p>${usage.ok ? `${usage.used} successful reads used of ${usage.limit}. ${usage.remaining} available. Renews ${escapeHtml(usage.renewsAt ?? '')} (UTC).` : 'Usage is temporarily unavailable.'}</p><p>Your connection remains saved when the read allowance is exhausted.</p><p><a href="${instructions}">Connection instructions</a></p>`);
    }
    return privatePage(`<h1>${record.status === 'approved' ? 'Access approved' : record.status === 'denied' ? 'Access not approved' : 'Approval pending'}</h1><p>${record.status === 'approved' ? (isStaging(env) ? 'Add the staging MCP URL in your client to connect your own Bee. Live Bee operations pause when the bounded test window expires.' : 'Add this MCP URL in your client to connect your own Bee account.') : 'Your email is verified. The owner must approve your request before Bee connection or data access.'}</p>${record.status === 'approved' ? `<p><label>MCP URL <input readonly value="${escapeHtml(url.origin + '/mcp')}"></label></p>` : ''}<p><a href="${instructions}">View homepage and connection instructions</a></p><p><a href="/admin">Manage requests (owner only)</a></p>`);
  }
  return null;
}
