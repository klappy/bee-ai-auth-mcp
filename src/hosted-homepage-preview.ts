import { embeddedAssets } from './embedded-assets';
import { verifyAccessJwt } from './access';
import { privatePage } from './signup';
import type { Env } from './types';

import { HOSTED_HOMEPAGE_HTML } from './hosted-homepage';

export async function preview(request: Request, env: Env): Promise<Response> {
  if (!['GET', 'HEAD'].includes(request.method)) return privatePage('Method not allowed', 405);
  if (!(await verifyAccessJwt(request, env))) return privatePage('Email verification required', 403);
  const url = new URL(request.url); url.pathname = url.pathname.slice('/preview'.length) || '/';
  const headers = new Headers(request.headers); headers.delete('If-None-Match');
  const isDraftHome = ['/', '/index', '/index.html'].includes(url.pathname);
  const response = isDraftHome
    ? new Response(request.method === 'HEAD' ? null : HOSTED_HOMEPAGE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
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


