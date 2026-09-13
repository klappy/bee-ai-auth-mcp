import { beforeEach, expect, it, vi } from 'vitest';
const calls = vi.hoisted(() => ({ auth: vi.fn(), api: vi.fn(), reserve: vi.fn(), upstream: vi.fn() }));
vi.mock('cloudflare:workers', () => ({ WorkerEntrypoint: class {} }));
vi.mock('@cloudflare/containers', () => ({ getContainer: vi.fn() }));
vi.mock('../src/bridge', () => ({ BeeBridge: class {} }));
vi.mock('../src/bee-auth', () => ({ BeeAuthHandler: { fetch: calls.auth } }));
vi.mock('../src/mcp-api', () => ({ McpApiHandler: { fetch: calls.api } }));
import production, { BeeBridge } from '../src/hosted';
import staging from '../src/staging';
import legacy from '../src/index';
import { grantIdentityAllowed, runtimeAllowed, type AdmissionState } from '../src/admission';
import { ownerUsageEnabled } from '../src/owner-usage';
import { deriveTenantKey } from '../src/telemetry';

const origin = 'https://production.example.test';
const ctx = { waitUntil: () => {} } as unknown as ExecutionContext;
function fixture(): any {
  const data = new Map<string, any>();
  const txn = { get: async (key: string) => structuredClone(data.get(key)), put: async (key: string, value: unknown) => { data.set(key, structuredClone(value)); } };
  const bridge: any = Object.create(BeeBridge.prototype);
  const env: any = { BEE_ENVIRONMENT: 'production', SIGNUP_ENABLED: 'true', CONSENT_SIGNING_SECRET: 'synthetic-signing', GITHUB_CLIENT_SECRET: 'synthetic-hmac', ALLOWED_GITHUB_LOGIN: 'existing-login',
    BEE_BRIDGE: { idFromName: (name: string) => name, get: () => bridge },
    OAUTH_KV: { get: async (key: string, type?: string | { type: string }) => { const value = data.get('kv:' + key); return value === undefined ? null : (typeof type === 'object' ? type.type : type) === 'json' ? JSON.parse(value) : value; }, put: async (key: string, value: string) => { data.set('kv:' + key, value); }, delete: async (key: string) => { data.delete('kv:' + key); }, list: async () => ({ keys: [], list_complete: true }) } };
  bridge.env = env; bridge.ctx = { storage: { transaction: async (fn: Function) => fn(txn) } }; bridge.reserveValidationRequest = calls.reserve;
  return { env, bridge, data };
}
beforeEach(() => { vi.clearAllMocks(); calls.reserve.mockResolvedValue(false); calls.auth.mockResolvedValue(new Response('auth')); calls.api.mockResolvedValue(new Response('mcp')); });

it('uses explicit runtime policy, preserving production despite expired validation settings', async () => {
  const { env } = fixture(); env.VALIDATION_EXPIRES_AT = '2020-01-01T00:00:00Z';
  expect(await runtimeAllowed(env)).toBe(true); expect(calls.reserve).not.toHaveBeenCalled();
  expect(await runtimeAllowed({ ...env, BEE_ENVIRONMENT: 'staging' })).toBe(false); expect(calls.reserve).toHaveBeenCalledOnce();
});
it('keeps production storage keys and limits while ignoring staging lifetime counters', async () => {
  const { bridge, data, env } = fixture(); data.set('signup:operations', 100_000);
  const record = await bridge.admission('signup', { email: 'test@example.test' });
  expect(record.status).toBe('pending'); expect(data.get('signup:authority').records).toHaveLength(1); expect(data.get('signup:operations')).toBe(100_000);
  env.BEE_ENVIRONMENT = 'staging'; await expect(bridge.admission('status', { email: 'test@example.test' })).rejects.toThrow('allowance exhausted');
  env.BEE_ENVIRONMENT = 'production';
  data.set('signup:authority', { records: Array.from({ length: 100 }, (_, i) => ({ id: String(i), email: i + '@example.test', status: 'pending', epoch: 0, createdAt: '' })) } satisfies AdmissionState);
  expect(await bridge.admission('signup', { email: 'overflow@example.test' })).toBeNull();
  for (let i = 0; i < 60; i++) expect(await bridge.admission('dcr', {})).toBe(true);
  expect(await bridge.admission('dcr', {})).toBe(false);
});
it('never enables staging owner observation in production, even with stale staging bindings', async () => {
  const { env } = fixture(); Object.assign(env, { OWNER_USAGE_ENABLED: 'true', STAGING_OWNER_EMAIL: 'owner@example.test' });
  expect(ownerUsageEnabled(env, 'owner@example.test')).toBe(false);
  expect(await deriveTenantKey(env, 'existing-login')).toMatch(/^t_/);
  expect(await deriveTenantKey({ ...env, BEE_ENVIRONMENT: 'staging' }, 'existing-login')).toBe('');
});
it('preserves real legacy GitHub grant exchange, refresh and native MCP without an email epoch', async () => {
  const { env, bridge } = fixture(); const redirect = 'https://client.example.test/cb';
  const reg = await production.fetch(new Request(origin + '/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ redirect_uris: [redirect], token_endpoint_auth_method: 'none' }) }), env, ctx);
  const client = await reg.json() as any;
  const verifier = 'synthetic-legacy-native-provider-verifier-123456789';
  const challenge = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))).toString('base64url');
  calls.auth.mockImplementationOnce(async (_request: Request, authEnv: any) => {
    const grant = await authEnv.OAUTH_PROVIDER.completeAuthorization({ request: { responseType: 'code', clientId: client.client_id, redirectUri: redirect, scope: ['bee_read'], state: 'synthetic', codeChallenge: challenge, codeChallengeMethod: 'S256', resource: origin + '/mcp' }, userId: 'existing-login', metadata: {}, scope: ['bee_read'], props: { login: 'existing-login', beeToken: 'synthetic-bee' } });
    return Response.redirect(grant.redirectTo);
  });
  const old = await legacy.fetch(new Request(origin + '/authorize'), env, ctx);
  const code = new URL(old.headers.get('Location')!).searchParams.get('code')!;
  const exchange = (values: Record<string, string>) => production.fetch(new Request(origin + '/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: client.client_id, ...values }) }), env, ctx);
  const issued = await exchange({ grant_type: 'authorization_code', code, code_verifier: verifier, redirect_uri: redirect });
  expect(issued.status).toBe(200); const tokens = await issued.json() as any;
  const refresh = await exchange({ grant_type: 'refresh_token', refresh_token: tokens.refresh_token }); expect(refresh.status).toBe(200);
  const current = await refresh.json() as any;
  expect((await production.fetch(new Request(origin + '/mcp', { headers: { Authorization: 'Bearer ' + current.access_token } }), env, ctx)).status).toBe(200);
  expect(calls.api.mock.calls[0][2].props).toMatchObject({ login: 'existing-login', beeToken: 'synthetic-bee' });
  expect(calls.api.mock.calls[0][2].props.admissionEpoch).toBeUndefined();
  expect(await grantIdentityAllowed(env, 'existing-login')).toBe(true);
  expect(await grantIdentityAllowed({ ...env, BEE_ENVIRONMENT: 'staging' }, 'existing-login')).toBe(false);
  env.ALLOWED_GITHUB_LOGIN = ''; expect((await exchange({ grant_type: 'refresh_token', refresh_token: current.refresh_token })).status).toBe(400);
  expect(calls.reserve).not.toHaveBeenCalled();
});
it.each(['/.well-known/oauth-authorization-server', '/.well-known/oauth-protected-resource/mcp'])('discovers %s anonymously in production without runtime', async path => {
  const { env } = fixture(); env.CONSENT_SIGNING_SECRET = '';
  const response = await production.fetch(new Request(origin + path), env, ctx); expect(response.status).toBe(200); expect(await response.text()).toContain(origin); expect(calls.reserve).not.toHaveBeenCalled();
});
it('preserves GitHub routes only in production and never serves a staging root there', async () => {
  const { env } = fixture(); const query = '?code_challenge_method=S256&code_challenge=' + 'a'.repeat(43);
  expect((await production.fetch(new Request(origin + '/authorize/github' + query), env, ctx)).status).toBe(200);
  expect((await staging.fetch(new Request(origin + '/authorize/github' + query), env, ctx)).status).toBe(404);
  expect(await (await production.fetch(new Request(origin), env, ctx)).text()).not.toContain('Bee staging');
  expect((await production.fetch(new Request(origin + '/authorize/github'), env, ctx)).status).toBe(400);
});

it('serves exact frozen public assets and HEAD but never shadows identity/protocol routes', async () => {
  const { env } = fixture();
  const root = await production.fetch(new Request(origin), env, ctx);
  const head = await production.fetch(new Request(origin, { method: 'HEAD' }), env, ctx);
  expect(root.status).toBe(200); expect(root.headers.get('ETag')).toBe(head.headers.get('ETag')); expect(await head.text()).toBe('');
  for (const path of ['/style.css', '/favicon.ico']) expect((await production.fetch(new Request(origin + path), env, ctx)).status).toBe(200);
  const alias = await production.fetch(new Request(origin + '/index.html'), env, ctx); expect(alias.status).toBe(307); expect(alias.headers.get('Location')).toBe('/');
  calls.auth.mockClear();
  expect((await production.fetch(new Request(origin + '/mcp'), env, ctx)).status).toBe(401);
  expect((await production.fetch(new Request(origin + '/admin'), env, ctx)).status).toBe(403);
  expect((await production.fetch(new Request(origin + '/signup'), env, ctx)).status).toBe(403);
  expect((await production.fetch(new Request(origin + '/.well-known/oauth-authorization-server'), env, ctx)).status).toBe(200);
  expect(calls.auth).not.toHaveBeenCalled();
});
