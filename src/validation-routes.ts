/** Isolated hosted-auth trial only: no homepage/public-copy publication. */
export function privateTrialRoute(request: Request): Response | null {
  const url = new URL(request.url);
  const methods: Record<string, readonly string[]> = {
    '/mcp': ['GET', 'POST', 'DELETE', 'OPTIONS'],
    '/register': ['POST', 'OPTIONS'],
    '/token': ['POST', 'OPTIONS'],
    '/.well-known/oauth-authorization-server': ['GET', 'OPTIONS'],
    '/.well-known/oauth-protected-resource': ['GET', 'OPTIONS'],
    '/.well-known/oauth-protected-resource/mcp': ['GET', 'OPTIONS'],
    '/authorize/email': ['GET'],
    '/consent': ['POST'],
    '/pairing/start': ['POST'],
    '/pairing/status': ['POST'],
  };
  if (url.pathname === '/authorize' && request.method === 'GET') {
    url.pathname = '/authorize/email';
    return new Response(null, { status: 307, headers: { Location: url.toString(), 'Cache-Control': 'no-store' } });
  }
  if (Object.hasOwn(methods, url.pathname) && methods[url.pathname].includes(request.method)) return null;
  return new Response('Isolated validation unavailable', { status: 503, headers: { 'Cache-Control': 'no-store' } });
}
