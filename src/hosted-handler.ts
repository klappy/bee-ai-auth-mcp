/** Shared native OAuth, signup and PKCE policy for hosted environments. */
import OAuthProvider, { OAuthError } from '@cloudflare/workers-oauth-provider';
import { BeeAuthHandler } from './bee-auth';
import { McpApiHandler } from './mcp-api';
import { isOriginAllowed } from './origin';
import { admissionStub, grantIdentityAllowed } from './admission';
import { boundedBody, privatePage, signupHandler } from './signup';
import { isStaging, type Env } from './types';

export function registrationValid(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  if (!Array.isArray(data.redirect_uris) || data.redirect_uris.length < 1 || data.redirect_uris.length > 5) return false;
  return data.redirect_uris.every(uri => {
    if (typeof uri !== 'string' || uri.length > 2048) return false;
    try { const url = new URL(uri); return url.protocol === 'https:' && !url.username && !url.password && !url.hash && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname); } catch { return false; }
  });
}
function oauthError(error: string, status = 400): Response { return Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } }); }


export async function hostedFetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    try {
      // Discovery, registration, signup, and the unauthenticated MCP challenge
      // remain usable while a bounded Bee runtime/signing window is closed.
      if (!env.CONSENT_SIGNING_SECRET && ['/authorize', '/authorize/email', '/authorize/github', '/callback', '/consent', '/pairing/start', '/pairing/status', '/signup/retry'].includes(url.pathname)) return oauthError('temporarily_unavailable', 503);
      if (env.SIGNUP_ENABLED === 'true' && (isStaging(env) || url.pathname !== '/')) {
        const signup = await signupHandler(request, env); if (signup) return signup;
      }
      if (request.method !== 'OPTIONS' && url.pathname.startsWith('/mcp') && !isOriginAllowed(request.headers.get('Origin'), request.url, env.ALLOWED_ORIGINS)) return oauthError('invalid_request', 403);
      if (['/authorize', '/authorize/email', '/authorize/github'].includes(url.pathname)) {
        if (request.method !== 'GET' || url.searchParams.get('code_challenge_method') !== 'S256' || !/^[A-Za-z0-9_-]{43}$/.test(url.searchParams.get('code_challenge') ?? '')) return oauthError('invalid_request');
        if (isStaging(env) && url.pathname === '/authorize') { url.pathname = '/authorize/email'; return new Response(null, { status: 307, headers: { Location: url.pathname + url.search, 'Cache-Control': 'no-store' } }); }
      }
      if (isStaging(env) && ['/authorize/github', '/callback'].includes(url.pathname)) return privatePage('This staging trial uses email sign-in.', 404);
      if (request.method === 'POST') {
        const body = await boundedBody(request); if (body === null) return oauthError('invalid_request', 413);
        if (url.pathname === '/register') {
          if (!request.headers.get('Content-Type')?.startsWith('application/json')) return oauthError('invalid_client_metadata');
          let value: unknown; try { value = JSON.parse(body); } catch { return oauthError('invalid_client_metadata'); }
          if (!registrationValid(value)) return oauthError('invalid_redirect_uri');
          if (!(await admissionStub(env).admission('dcr', {}))) return oauthError('temporarily_unavailable', 429);
        }
        request = new Request(request, { body });
      }
      const provider = new OAuthProvider({ apiRoute: '/mcp', apiHandler: McpApiHandler, defaultHandler: BeeAuthHandler, authorizeEndpoint: '/authorize', tokenEndpoint: '/token', clientRegistrationEndpoint: '/register', scopesSupported: ['bee_read'], allowPlainPKCE: false,
        tokenExchangeCallback: async ({ props }) => {
          if (!props || typeof props.login !== 'string' || !(await grantIdentityAllowed(env, props.login, props.admissionEpoch))) throw new OAuthError('invalid_grant', { description: 'Owner approval is required. Reconnect after approval.' });
        },
      });
      return await provider.fetch(request, env, ctx);
    } catch { return oauthError('temporarily_unavailable', 503); }
}
