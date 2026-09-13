import type { Env } from './types';
import { HOSTED_HOMEPAGE_HTML } from './hosted-homepage';
// Approved hosted homepage, released at runtime once the weekly allowance is actually enabled
// (the accepted-prerequisites condition from DEPLOYMENT-SOURCE-FIRE-2026-09-11, now expressed as
// configuration under the githook deploy model). Only the exact review-only notice is removed;
// every other byte of the approved page is served as authored. Staging keeps the notice.
const REVIEW_NOTICE = '<aside class="pair-help" aria-label="Draft status"><strong>Homepage draft — review only.</strong> This describes the intended launch experience. Immediate free access and paid upgrades are not enabled yet.</aside>';
export function releasedHomepage(env: Pick<Env, 'SELF_SERVICE_ENABLED'>): string | null {
  if (env.SELF_SERVICE_ENABLED !== 'true') return null;
  const parts = HOSTED_HOMEPAGE_HTML.split(REVIEW_NOTICE);
  return parts.length === 2 ? parts.join('') : null;
}
export async function homepageResponse(request: Request, html: string): Promise<Response> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(html));
  const etag = `"${[...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('')}"`;
  const headers = new Headers({ 'Content-Type': 'text/html; charset=utf-8', ETag: etag, 'Cache-Control': 'public, max-age=300' });
  if ((request.headers.get('If-None-Match') || '').split(',').some(t => t.trim().replace(/^W\//, '') === etag || t.trim() === '*')) return new Response(null, { status: 304, headers });
  return new Response(request.method === 'HEAD' ? null : html, { status: 200, headers });
}
