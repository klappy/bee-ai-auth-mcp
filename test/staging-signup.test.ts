import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocked = vi.hoisted(() => ({ verify: vi.fn(), authority: vi.fn(), api: vi.fn(), auth: vi.fn() }));
vi.mock('cloudflare:workers', () => ({ WorkerEntrypoint: class {} }));
vi.mock('../src/validation', () => ({ BeeBridge: class {} }));
vi.mock('../src/access', () => ({ verifyAccessJwt: mocked.verify }));
vi.mock('../src/mcp-api', () => ({ McpApiHandler: { fetch: mocked.api } }));
vi.mock('../src/bee-auth', () => ({ BeeAuthHandler: { fetch: mocked.auth } }));
import entry, { BeeBridge, registrationValid } from '../src/staging';
import { signupHandler } from '../src/signup';
import { admissionTransition, type AdmissionState } from '../src/admission';

const origin = 'https://staging.example.test';
function environment(): any {
  const kv = new Map<string, string>(); const state: AdmissionState = { records: [] };
  mocked.authority.mockImplementation(async (op, args) => admissionTransition(state, op, args));
  return { SIGNUP_ENABLED: 'true', CONSENT_SIGNING_SECRET: 'synthetic-test-signing-only', ACCESS_AUD: 'email-aud', STAGING_PREVIEW_AUD: 'owner-aud', STAGING_OWNER_EMAIL: 'owner@example.test',
    BEE_BRIDGE: { idFromName: (name: string) => name, get: () => ({ admission: mocked.authority }) },
    OAUTH_KV: { get: async (key: string, type?: string | { type: string }) => { const v = kv.get(key); return v === undefined ? null : (typeof type === 'object' ? type.type : type) === 'json' ? JSON.parse(v) : v; }, put: async (key: string, value: string) => { kv.set(key, value); }, delete: async (key: string) => { kv.delete(key); }, list: async (options: { prefix: string }) => ({ keys: [...kv.keys()].filter(k => k.startsWith(options.prefix)).map(name => ({ name })), list_complete: true }) },
  };
}
const ctx = { waitUntil: (_p: Promise<unknown>) => {} } as ExecutionContext;
beforeEach(() => { vi.clearAllMocks(); vi.useRealTimers(); mocked.verify.mockResolvedValue(null); mocked.auth.mockResolvedValue(new Response('auth')); });

describe('staging public native OAuth', () => {
  it.each(['/.well-known/oauth-authorization-server', '/.well-known/oauth-protected-resource', '/.well-known/oauth-protected-resource/mcp'])('serves %s with no runtime window, Access identity, or Container call', async path => {
    const response = await entry.fetch(new Request(origin + path), { ...environment(), CONSENT_SIGNING_SECRET: '' }, ctx);
    expect(response.status).toBe(200); expect(response.headers.get('Content-Type')).toContain('application/json');
    const body = await response.json(); expect(JSON.stringify(body)).toContain(origin); expect(mocked.authority).not.toHaveBeenCalled();
  });
  it('returns actual 401 resource challenge for unauthenticated MCP', async () => {
    const response = await entry.fetch(new Request(origin + '/mcp', { method: 'POST', body: '{}' }), { ...environment(), CONSENT_SIGNING_SECRET: '' }, ctx);
    expect(response.status).toBe(401); expect(response.headers.get('WWW-Authenticate')).toContain(origin + '/.well-known/oauth-protected-resource/mcp');
    expect(mocked.api).not.toHaveBeenCalled();
  });
  it('registers using the actual provider, not a synthetic client facade', async () => {
    const response = await entry.fetch(new Request(origin + '/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ redirect_uris: ['https://chatgpt.com/connector_platform/oauth/callback'], token_endpoint_auth_method: 'none' }) }), environment(), ctx);
    expect(response.status).toBe(201); const body = await response.json() as any; expect(body.client_id).toBeTruthy(); expect(body.redirect_uris).toEqual(['https://chatgpt.com/connector_platform/oauth/callback']);
  });
  it('native PKCE exchange succeeds only at current approved epoch and refresh fails immediately after denial', async () => {
    const env = environment(), email = 'approved@example.test', redirect = 'https://client.example.test/cb';
    const record = await mocked.authority('signup', { email });
    const decide = async (status: string) => {
      const nonce = await mocked.authority('nonce', { email: 'owner@example.test', id: record.id, status });
      expect(await mocked.authority('decision', { email: 'owner@example.test', id: record.id, status, nonce })).toBe(true);
    };
    await decide('approved');
    const registration = await entry.fetch(new Request(origin + '/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ redirect_uris: [redirect], token_endpoint_auth_method: 'none' }) }), env, ctx);
    const client = await registration.json() as any;
    const verifier = 'synthetic-code-verifier-for-real-native-provider-123456789';
    const challenge = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))).toString('base64url');
    // Only the upstream Bee approval is synthetic here. Grant encryption, PKCE,
    // token issue/refresh and our strong admission callback are actual code.
    mocked.auth.mockImplementationOnce(async (_request: Request, authEnv: any) => {
      const grant = await authEnv.OAUTH_PROVIDER.completeAuthorization({ request: { responseType: 'code', clientId: client.client_id, redirectUri: redirect, scope: ['bee_read'], state: 'synthetic', codeChallenge: challenge, codeChallengeMethod: 'S256', resource: origin + '/mcp' }, userId: email, metadata: {}, scope: ['bee_read'], props: { login: email, beeToken: 'synthetic-upstream-token', admissionEpoch: record.epoch } });
      return Response.redirect(grant.redirectTo);
    });
    const consent = await entry.fetch(new Request(origin + '/authorize/email?code_challenge_method=S256&code_challenge=' + challenge), env, ctx);
    expect(consent.status).toBe(302);
    const code = new URL(consent.headers.get('Location')!).searchParams.get('code')!;
    const exchange = async (values: Record<string, string>) => entry.fetch(new Request(origin + '/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: client.client_id, ...values }) }), env, ctx);
    const response = await exchange({ grant_type: 'authorization_code', code, code_verifier: verifier, redirect_uri: redirect });
    expect(response.status).toBe(200); const token = await response.json() as any; expect(token.access_token).toBeTruthy(); expect(token.refresh_token).toBeTruthy();
    await decide('denied');
    const denied = await exchange({ grant_type: 'refresh_token', refresh_token: token.refresh_token });
    expect(denied.status).toBe(400); expect((await denied.json() as any).error).toBe('invalid_grant');
    await decide('approved');
    const stale = await exchange({ grant_type: 'refresh_token', refresh_token: token.refresh_token });
    expect(stale.status).toBe(400); expect((await stale.json() as any).error).toBe('invalid_grant');
  });
  it('rejects plain or absent PKCE before auth, while S256 redirects intact', async () => {
    const env = environment(); expect((await entry.fetch(new Request(origin + '/authorize?client_id=x'), env, ctx)).status).toBe(400);
    const query = '?client_id=x&code_challenge_method=S256&code_challenge=' + 'a'.repeat(43);
    const response = await entry.fetch(new Request(origin + '/authorize' + query), env, ctx); expect(response.status).toBe(307); expect(response.headers.get('Location')).toBe('/authorize/email' + query);
  });
  it('limits actual bytes without trusting Content-Length', async () => {
    const response = await entry.fetch(new Request(origin + '/register', { method: 'POST', body: 'x'.repeat(16385) }), environment(), ctx); expect(response.status).toBe(413);
  });
  it('rejects unsafe redirect schemes, fragments, credentials and overlarge redirect sets', () => {
    for (const uri of ['http://example.test/cb', 'javascript:alert(1)', 'https://user:pass@example.test/cb', 'https://example.test/cb#fragment']) expect(registrationValid({ redirect_uris: [uri] })).toBe(false);
    expect(registrationValid({ redirect_uris: Array(6).fill('https://example.test/cb') })).toBe(false);
  });
});

describe('signup and owner request list', () => {
  it('keeps anonymous root neutral and prevents preview publication', async () => {
    const env = environment(); const root = await entry.fetch(new Request(origin), env, ctx); expect(await root.text()).toContain('Request access');
    expect((await entry.fetch(new Request(origin + '/preview/'), env, ctx)).status).toBe(403);
  });
  it('creates pending for any verified address without starting runtime', async () => {
    const env = environment(); mocked.verify.mockResolvedValue({ email: 'new@example.test' });
    const response = await signupHandler(new Request(origin + '/signup'), env); expect(response?.status).toBe(200); expect(await response?.text()).toContain('Approval pending');
    expect(mocked.authority).toHaveBeenCalledWith('signup', { email: 'new@example.test' });
  });
  it('pins separate owner audience and also checks owner email', async () => {
    const env = environment(); mocked.verify.mockResolvedValue({ email: 'visitor@example.test' });
    expect((await signupHandler(new Request(origin + '/admin'), env))?.status).toBe(403);
    expect(mocked.verify.mock.calls[0][1].ACCESS_AUD).toBe('owner-aud'); expect(mocked.authority).not.toHaveBeenCalled();
  });
  it('rejects cross-origin admin actions before nonce consumption', async () => {
    const env = environment(); mocked.verify.mockResolvedValue({ email: 'owner@example.test' });
    const request = new Request(origin + '/admin/decision', { method: 'POST', headers: { Origin: 'https://evil.example.test', 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'id=forged&status=approved&nonce=forged' });
    expect((await signupHandler(request, env))?.status).toBe(403); expect(mocked.authority).not.toHaveBeenCalled();
  });
});

describe('staging shutdown and cumulative quotas', () => {
  function instance() {
    const state = new Map<string, unknown>(); const bridge = Object.create(BeeBridge.prototype);
    const storage = { get: async (key: string) => state.get(key), put: async (key: string, value: unknown) => { state.set(key, value); } };
    bridge.ctx = { storage: { ...storage, transaction: async (fn: any) => fn(storage) } }; bridge.env = { VALIDATION_STARTS_AT: '2026-09-10T10:00:00.000Z', VALIDATION_EXPIRES_AT: '2026-09-10T12:00:00.000Z' };
    bridge.schedule = vi.fn().mockResolvedValue({}); bridge.destroy = vi.fn().mockResolvedValue(undefined); return { bridge, state };
  }
  it('never resets lifetime counter or lets historical stop flag permanently block a newly authorized window', async () => {
    vi.useFakeTimers(); vi.setSystemTime(Date.parse('2026-09-10T11:00:00Z')); const { bridge, state } = instance(); state.set('validation:requests', 9999); state.set('validation:stopped', true);
    expect(await bridge.reserveValidationRequest()).toBe(true); expect(await bridge.reserveValidationRequest()).toBe(false); expect(state.get('validation:requests')).toBe(10000);
  });
  it('historical and old-window alarms cannot destroy a newer active window', async () => {
    vi.useFakeTimers(); vi.setSystemTime(Date.parse('2026-09-10T11:00:00Z')); const { bridge } = instance();
    await bridge.expireValidation(); await bridge.expireStagingValidation(Date.parse('2026-09-10T10:00:00Z')); expect(bridge.destroy).not.toHaveBeenCalled();
    vi.setSystemTime(Date.parse('2026-09-10T12:00:00Z')); expect(await bridge.reserveValidationRequest()).toBe(false); await bridge.expireStagingValidation(Date.now()); expect(bridge.destroy).toHaveBeenCalledOnce();
  });
});
