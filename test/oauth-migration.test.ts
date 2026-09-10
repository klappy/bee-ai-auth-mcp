import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ verify: vi.fn(), bridge: vi.fn(), api: vi.fn() }));
vi.mock('cloudflare:workers', () => ({ WorkerEntrypoint: class {} }));
vi.mock('../src/validation', () => ({ BeeBridge: class {} }));
vi.mock('../src/bridge', () => ({ BeeBridge: class {} }));
vi.mock('../src/access', () => ({ verifyAccessJwt: mocks.verify }));
vi.mock('@cloudflare/containers', () => ({ getContainer: () => ({ fetch: mocks.bridge }) }));
vi.mock('../src/mcp-api', () => ({ McpApiHandler: { fetch: mocks.api } }));
import entry from '../src/staging';
import selfHostEntry from '../src/index';
import { admissionTransition, type AdmissionState } from '../src/admission';

const origin = 'https://staging.example.test', redirect = 'https://client.example.test/callback';
const verifier = 'synthetic-code-verifier-for-native-oauth-tests-123456789';
const ctx = { waitUntil: () => {} } as any;
function fixture() {
  const kv = new Map<string, string>(); const authority: AdmissionState = { records: ['synthetic@example.test', 'first@example.test', 'second@example.test'].map((email, i) => ({ id: 'synthetic-' + i, email, status: 'approved', epoch: 0, createdAt: '2026-09-10T00:00:00.000Z' })) };
  const env: any = { SIGNUP_ENABLED: 'true', CONSENT_SIGNING_SECRET: 'synthetic-signing-only',
    BEE_BRIDGE: { idFromName: (n: string) => n, get: () => ({ admission: async (op: any, args: any) => admissionTransition(authority, op, args), reserveValidationRequest: async () => true }) },
    OAUTH_KV: {
      get: async (k: string, type?: any) => { const v = kv.get(k); return v === undefined ? null : (type === 'json' || type?.type === 'json') ? JSON.parse(v) : v; },
      put: async (k: string, v: string) => { kv.set(k, v); }, delete: async (k: string) => { kv.delete(k); },
      list: async ({ prefix }: any) => ({ keys: [...kv.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
    },
  };
  const request = (path: string, init?: RequestInit) => entry.fetch(new Request(origin + path, init), env, ctx);
  const register = (metadata: Record<string, unknown> = {}) => request('/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_name: 'Synthetic client', redirect_uris: [redirect], grant_types: ['authorization_code', 'refresh_token'], ...metadata }) });
  const token = (fields: Record<string, string>) => request('/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(fields) });
  const authorize = async (clientId: string, resource?: string, identity = 'synthetic@example.test') => {
    mocks.verify.mockResolvedValue({ email: identity });
    const challenge = Buffer.from(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))).toString('base64url');
    const query = new URLSearchParams({ client_id: clientId, redirect_uri: redirect, response_type: 'code', scope: 'bee_read', state: 'synthetic-state', code_challenge: challenge, code_challenge_method: 'S256', ...(resource ? { resource } : {}) });
    const consent = await request('/authorize/email?' + query); expect(consent.status).toBe(200);
    const body = await consent.text(); const signed = body.match(/name="s" value="([^"]+)"/)?.[1]; expect(signed).toBeTruthy();
    const complete = await request('/consent', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ s: signed!, bee_token: 'synthetic-bee-token' }) });
    expect(complete.status).toBe(302); const location = new URL(complete.headers.get('Location')!);
    expect(location.searchParams.get('iss')).toBe(origin); expect(location.searchParams.get('state')).toBe('synthetic-state');
    return location.searchParams.get('code')!;
  };
  return { env, kv, authority, request, register, token, authorize };
}
beforeEach(() => { vi.clearAllMocks(); mocks.bridge.mockResolvedValue(Response.json({ id: 'synthetic-bee' })); mocks.api.mockResolvedValue(Response.json({ ok: true })); });

describe('maintained provider authentication negotiation', () => {
  it.each([
    ['none', { token_endpoint_auth_method: 'none' }],
    ['preferred private key with none alternative', { token_endpoint_auth_method: 'private_key_jwt', token_endpoint_auth_methods_supported: ['private_key_jwt', 'none'] }],
    ['alternatives without preference', { token_endpoint_auth_methods_supported: ['private_key_jwt', 'none'] }],
  ])('%s completes actual email consent, PKCE code, MCP and refresh', async (_label, metadata) => {
    const f = fixture(); const registered = await f.register(metadata); expect(registered.status).toBe(201);
    const client = await registered.json() as any; expect(client.token_endpoint_auth_method).toBe('none'); expect(client.client_secret).toBeUndefined(); expect(client.registration_client_uri).toBeUndefined();
    const code = await f.authorize(client.client_id, origin + '/mcp');
    const wrong = await f.token({ grant_type: 'authorization_code', client_id: client.client_id, code, redirect_uri: redirect, code_verifier: verifier, resource: 'https://wrong.example.test/mcp' });
    expect(wrong.status).toBe(400); expect((await wrong.json() as any).error).toBe('invalid_target');
    const response = await f.token({ grant_type: 'authorization_code', client_id: client.client_id, code, redirect_uri: redirect, code_verifier: verifier, resource: origin + '/mcp' });
    expect(response.status).toBe(200); const token = await response.json() as any; expect(token.access_token).toBeTruthy(); expect(token.refresh_token).toBeTruthy();
    expect((await f.request('/mcp', { headers: { Authorization: 'Bearer ' + token.access_token } })).status).toBe(200);
    const wrongRefresh = await f.token({ grant_type: 'refresh_token', client_id: client.client_id, refresh_token: token.refresh_token, resource: 'https://wrong.example.test/mcp' });
    expect(wrongRefresh.status).toBe(400); expect((await wrongRefresh.json() as any).error).toBe('invalid_target');
    expect((await f.token({ grant_type: 'refresh_token', client_id: client.client_id, refresh_token: token.refresh_token, resource: origin + '/mcp' })).status).toBe(200);
  });
  it('rejects private-key-only rather than fabricating symmetric-secret support', async () => {
    const f = fixture(); const r = await f.register({ token_endpoint_auth_method: 'private_key_jwt' });
    expect(r.status).toBe(400); const body = await r.json() as any; expect(body.error).toBe('invalid_client_metadata'); expect(body.client_secret).toBeUndefined();
    expect([...f.kv.keys()].filter(k => k.startsWith('client:'))).toHaveLength(0);
  });
  it('metadata is honest about issuer, S256, resources, registration and disabled CIMD', async () => {
    const f = fixture();
    const auth = await (await f.request('/.well-known/oauth-authorization-server')).json() as any;
    expect(auth.issuer).toBe(origin); expect(auth.authorization_response_iss_parameter_supported).toBe(true); expect(auth.code_challenge_methods_supported).toEqual(['S256']);
    expect(auth.client_id_metadata_document_supported).toBe(false); expect(auth.token_endpoint_auth_methods_supported).not.toContain('private_key_jwt');
    expect(auth.registration_endpoint).toBe(origin + '/register');
    const resource = await (await f.request('/.well-known/oauth-protected-resource/mcp')).json() as any;
    expect(resource.resource).toBe(origin + '/mcp'); expect(resource.authorization_servers).toEqual([origin]);
    const challenge = await f.request('/mcp'); expect(challenge.status).toBe(401); expect(challenge.headers.get('WWW-Authenticate')).toContain(origin + '/.well-known/oauth-protected-resource/mcp');
    expect(mocks.bridge).not.toHaveBeenCalled();
  });
  it('wrong verifier is rejected and new authorization for another account does not revoke the first', async () => {
    const f = fixture(); const client = await (await f.register({ token_endpoint_auth_method: 'none' })).json() as any;
    const code = await f.authorize(client.client_id, undefined, 'first@example.test');
    const wrong = await f.token({ grant_type: 'authorization_code', client_id: client.client_id, code, redirect_uri: redirect, code_verifier: 'wrong'.repeat(12) }); expect(wrong.status).toBe(400);
    const valid = await f.token({ grant_type: 'authorization_code', client_id: client.client_id, code, redirect_uri: redirect, code_verifier: verifier }); expect(valid.status).toBe(200);
    const first = await valid.json() as any;
    await f.authorize(client.client_id, undefined, 'second@example.test');
    expect((await f.token({ grant_type: 'refresh_token', client_id: client.client_id, refresh_token: first.refresh_token })).status).toBe(200);
  });
  it('retains legacy unbound-grant refresh without silently persisting a new resource', async () => {
    const f = fixture(); const client = await (await f.register({ token_endpoint_auth_method: 'none' })).json() as any;
    const code = await f.authorize(client.client_id);
    // Synthetic storage fixture only: emulate a grant written before resource
    // binding existed. Never mutate real grants as an upgrade strategy.
    const key = [...f.kv.keys()].find(k => k.startsWith('grant:'))!;
    const legacy = JSON.parse(f.kv.get(key)!); delete legacy.resource; f.kv.set(key, JSON.stringify(legacy));
    const exchanged = await f.token({ grant_type: 'authorization_code', client_id: client.client_id, code, redirect_uri: redirect, code_verifier: verifier });
    expect(exchanged.status).toBe(200); const token = await exchanged.json() as any;
    expect((await f.token({ grant_type: 'refresh_token', client_id: client.client_id, refresh_token: token.refresh_token })).status).toBe(200);
    expect(JSON.parse(f.kv.get(key)!).resource).toBeUndefined();
  });
  it('renders terminal authorization errors locally, never redirects to unvalidated client input', async () => {
    const f = fixture(); const client = await (await f.register({ token_endpoint_auth_method: 'none' })).json() as any;
    const query = new URLSearchParams({ client_id: client.client_id, redirect_uri: 'https://unregistered.example.test/callback', response_type: 'code', code_challenge_method: 'S256', code_challenge: 'a'.repeat(43) });
    const response = await f.request('/authorize/email?' + query);
    expect(response.status).toBe(400); expect(response.headers.get('Location')).toBeNull();
    expect(await response.text()).toContain('Invalid authorization request');
  });
  it('preserves the separate GitHub self-host authorization entry', async () => {
    const f = fixture(); const env = { ...f.env, SIGNUP_ENABLED: 'false', GITHUB_CLIENT_ID: 'synthetic-github-client' };
    const request = (path: string, init?: RequestInit) => selfHostEntry.fetch(new Request(origin + path, init), env, ctx);
    const registered = await request('/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ redirect_uris: [redirect], token_endpoint_auth_method: 'none' }) });
    const client = await registered.json() as any;
    const query = new URLSearchParams({ client_id: client.client_id, redirect_uri: redirect, response_type: 'code', code_challenge_method: 'S256', code_challenge: 'a'.repeat(43) });
    const response = await request('/authorize/github?' + query); expect(response.status).toBe(302);
    const target = new URL(response.headers.get('Location')!); expect(target.origin).toBe('https://github.com'); expect(target.pathname).toBe('/login/oauth/authorize');
    expect(mocks.bridge).not.toHaveBeenCalled();
  });
});
