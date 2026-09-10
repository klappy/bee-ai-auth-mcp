/** Isolated staging entry. No production configuration or image change. */
import OAuthProvider, { OAuthError } from '@cloudflare/workers-oauth-provider';
import { BeeBridge as ValidationBridge } from './validation';
import { BeeAuthHandler } from './bee-auth';
import { McpApiHandler } from './mcp-api';
import { embeddedAssets } from './embedded-assets';
import { verifyAccessJwt } from './access';
import { isOriginAllowed } from './origin';
import { admissionAllowed, admissionStub, admissionTransition, type AdmissionOperation, type AdmissionState } from './admission';
import { boundedBody, privatePage, signupHandler } from './signup';
import { validationExpiry, VALIDATION_REQUEST_LIMIT, type ValidationWindow } from './validation-window';
import type { Env } from './types';

type StagingEnv = Env & ValidationWindow;
export class BeeBridge extends ValidationBridge {
  async admission(op: AdmissionOperation, input: Record<string, string>): Promise<unknown> {
    return this.ctx.storage.transaction(async txn => {
      const count = (await txn.get<number>('signup:operations')) ?? 0;
      if (count >= 100_000) throw new Error('Staging operation allowance exhausted');
      await txn.put('signup:operations', count + 1);
      const state = (await txn.get<AdmissionState>('signup:authority')) ?? { records: [] };
      const result = admissionTransition(state, op, input);
      await txn.put('signup:authority', state);
      return result;
    });
  }
  override async reserveValidationRequest(): Promise<boolean> {
    const expiry = validationExpiry(this.env as StagingEnv);
    if (expiry === null) return false;
    const admitted = await this.ctx.storage.transaction(async txn => {
      const count = (await txn.get<number>('validation:requests')) ?? 0;
      if (count >= VALIDATION_REQUEST_LIMIT) return false;
      await txn.put('validation:requests', count + 1); return true;
    });
    if (!admitted) return false;
    const scheduleKey = `signup:shutdown:${expiry}`;
    if (!(await this.ctx.storage.get<boolean>(scheduleKey))) {
      await this.schedule(new Date(expiry), 'expireStagingValidation', expiry);
      await this.ctx.storage.put(scheduleKey, true);
    }
    return validationExpiry(this.env as StagingEnv) !== null;
  }
  async expireStagingValidation(scheduledExpiry: number): Promise<void> {
    const currentExpiry = Date.parse((this.env as StagingEnv).VALIDATION_EXPIRES_AT ?? '');
    if (currentExpiry !== scheduledExpiry || Date.now() < scheduledExpiry) return;
    await this.destroy();
  }
  override async expireValidation(): Promise<void> {
    // Historical alarms carry no payload. Never destroy a newer active window.
    if (validationExpiry(this.env as StagingEnv) !== null) return;
    await this.destroy();
  }
}

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

async function preview(request: Request, env: StagingEnv): Promise<Response> {
  if (!['GET', 'HEAD'].includes(request.method)) return privatePage('Method not allowed', 405);
  if (!(await verifyAccessJwt(request, env))) return privatePage('Email verification required', 403);
  const url = new URL(request.url); url.pathname = url.pathname.slice('/preview'.length) || '/';
  const headers = new Headers(request.headers); headers.delete('If-None-Match');
  const response = await embeddedAssets.fetch(new Request(url, { method: request.method, headers }));
  const outHeaders = new Headers(response.headers);
  outHeaders.set('Cache-Control', 'private, no-store'); outHeaders.set('Referrer-Policy', 'no-referrer'); outHeaders.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  if (outHeaders.has('Location')) outHeaders.set('Location', '/preview' + outHeaders.get('Location'));
  if (response.status === 200 && request.method === 'GET' && outHeaders.get('Content-Type')?.includes('text/html')) {
    let body = (await response.text()).replaceAll('https://bee.klappy.dev', url.origin);
    // Frozen homepage keeps its copy. Absolute local asset/page paths live under the verified preview namespace.
    body = body.replace(/(href|src)=(['"])\/(?!\/)([^'"\s]*)\2/g, (_m, attr, quote, path) => `${attr}=${quote}/preview/${path}${quote}`);
    body = body.replace('<head>', '<head><base href="/preview/">');
    outHeaders.delete('Content-Length'); outHeaders.delete('ETag');
    return new Response(body, { status: response.status, headers: outHeaders });
  }
  return new Response(response.body, { status: response.status, headers: outHeaders });
}

export default {
  async fetch(request: Request, env: StagingEnv, ctx: ExecutionContext): Promise<Response> {
    if (env.SIGNUP_ENABLED !== 'true') return privatePage('Staging is not configured', 503);
    const url = new URL(request.url);
    try {
      // Discovery, registration, signup, and the unauthenticated MCP challenge
      // remain usable while a bounded Bee runtime/signing window is closed.
      if (!env.CONSENT_SIGNING_SECRET && ['/authorize', '/authorize/email', '/consent', '/pairing/start', '/pairing/status', '/signup/retry'].includes(url.pathname)) return oauthError('temporarily_unavailable', 503);
      if (url.pathname === '/preview' || url.pathname.startsWith('/preview/')) return preview(request, env);
      const signup = await signupHandler(request, env); if (signup) return signup;
      if (request.method !== 'OPTIONS' && url.pathname.startsWith('/mcp') && !isOriginAllowed(request.headers.get('Origin'), request.url, env.ALLOWED_ORIGINS)) return oauthError('invalid_request', 403);
      if (['/authorize', '/authorize/email'].includes(url.pathname)) {
        if (request.method !== 'GET' || url.searchParams.get('code_challenge_method') !== 'S256' || !/^[A-Za-z0-9_-]{43}$/.test(url.searchParams.get('code_challenge') ?? '')) return oauthError('invalid_request');
        if (url.pathname === '/authorize') { url.pathname = '/authorize/email'; return new Response(null, { status: 307, headers: { Location: url.pathname + url.search, 'Cache-Control': 'no-store' } }); }
      }
      if (['/authorize/github', '/callback'].includes(url.pathname)) return privatePage('This staging trial uses email sign-in.', 404);
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
          if (!props || typeof props.login !== 'string' || !Number.isInteger(props.admissionEpoch) || !(await admissionAllowed(env, props.login, props.admissionEpoch))) throw new OAuthError('invalid_grant', { description: 'Owner approval is required. Reconnect after approval.' });
        },
      });
      return await provider.fetch(request, env, ctx);
    } catch { return oauthError('temporarily_unavailable', 503); }
  },
};
