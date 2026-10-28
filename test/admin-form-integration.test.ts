vi.mock('@cloudflare/containers', () => ({ getContainer: vi.fn() }));
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
vi.mock('cloudflare:workers', () => ({ WorkerEntrypoint: class {} }));
vi.mock('../src/bridge', () => ({ BeeBridge: class {} }));
vi.mock('../src/mcp-api', () => ({ McpApiHandler: { fetch: vi.fn() } }));
vi.mock('../src/bee-auth', () => ({ BeeAuthHandler: { fetch: vi.fn() } }));
import staging, { BeeBridge } from '../src/staging';
import production from '../src/hosted';
import { __resetJwksCacheForTests } from '../src/access';

const origin = 'https://staging.example.test', owner = 'owner@example.test';
let env: any, bridge: any, jwt: string, visitorJwt: string;
let entry = staging;
const ctx = { waitUntil: () => {} } as unknown as ExecutionContext;
beforeEach(async () => {
  const keys = await generateKeyPair('RS256');
  const jwk = { ...await exportJWK(keys.publicKey), kid: 'admin-regression', alg: 'RS256' };
  vi.stubGlobal('fetch', async (url: unknown) => {
    expect(String(url)).toBe('https://team.example.test/cdn-cgi/access/certs');
    return Response.json({ keys: [jwk] });
  });
  const mint = (email: string, audience: string) => new SignJWT({ email }).setProtectedHeader({ alg: 'RS256', kid: jwk.kid }).setIssuer('https://team.example.test').setAudience(audience).setIssuedAt().setExpirationTime('5m').sign(keys.privateKey);
  jwt = await mint(owner, 'owner-aud'); visitorJwt = await mint('visitor@example.test', 'signup-aud');
  const values = new Map<string, unknown>();
  const storage = { get: async (key: string) => structuredClone(values.get(key)), put: async (key: string, value: unknown) => { values.set(key, structuredClone(value)); } };
  bridge = Object.create(BeeBridge.prototype);
  bridge.ctx = { storage: { ...storage, transaction: async (fn: any) => fn(storage) } };
  env = { BEE_ENVIRONMENT: 'staging', SIGNUP_ENABLED: 'true', ACCESS_TEAM_DOMAIN: 'team.example.test', ACCESS_AUD: 'signup-aud', STAGING_PREVIEW_AUD: 'owner-aud', STAGING_OWNER_EMAIL: owner,
    BEE_BRIDGE: { idFromName: (name: string) => name, get: () => bridge } };
  bridge.env = env;
  await bridge.admission('signup', { email: 'visitor@example.test' });
});
afterEach(() => { vi.unstubAllGlobals(); __resetJwksCacheForTests(); });
const request = (path: string, init: RequestInit = {}, token = jwt) => entry.fetch(new Request(origin + path, { ...init, headers: { 'Cf-Access-Jwt-Assertion': token, ...init.headers } }), env, ctx);
async function pageForms() {
  const response = await request('/admin'); expect(response.status).toBe(200);
  const html = await response.text();
  const forms = [...html.matchAll(/<form\b[^>]*>([\s\S]*?)<\/form>/g)].map(m => new URLSearchParams([...m[1].matchAll(/name="([^"]+)" value="([^"]*)"/g)].map(i => [i[1], i[2]])));
  return { response, forms };
}
const post = (form: URLSearchParams, originHeader = origin, token = jwt) => request('/admin/decision', { method: 'POST', headers: { Origin: originHeader, 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString() }, token);

describe.each(['staging', 'production'])('rendered owner form with real JWT in %s', runtime => {
  beforeEach(() => {
    entry = runtime === 'staging' ? staging : production;
    env.BEE_ENVIRONMENT = runtime;
    if (runtime === 'production') { env.ADMIN_ACCESS_AUD = env.STAGING_PREVIEW_AUD; env.ADMIN_OWNER_EMAIL = env.STAGING_OWNER_EMAIL; delete env.STAGING_PREVIEW_AUD; delete env.STAGING_OWNER_EMAIL; }
  });
  it('preserves a same-origin browser POST Origin without cross-origin referrer disclosure', async () => {
    const { response, forms } = await pageForms();
    // Fetch §3.2 serializes a navigation POST Origin as null under no-referrer.
    // The admin document must instead preserve same-origin navigation identity.
    expect(response.headers.get('Referrer-Policy')).toBe('same-origin');
    expect(response.headers.get('Content-Security-Policy')).toContain("form-action 'self'");
    expect((await post(forms[0], 'null')).status).toBe(403);
    expect((await post(forms[0])).status).toBe(303);
    expect((await bridge.admission('status', { email: 'visitor@example.test' })).status).toBe('approved');
    expect((await post(forms[0])).status).toBe(409);
  });
  it('keeps an open form usable after another list load but rejects stale opposite decisions', async () => {
    const first = await pageForms(); await pageForms();
    expect((await post(first.forms[0])).status).toBe(303);
    expect((await post(first.forms[1])).status).toBe(409);
    const fresh = await pageForms(); expect((await post(fresh.forms[1])).status).toBe(303);
    expect((await bridge.admission('status', { email: 'visitor@example.test' })).status).toBe('denied');
  });
  it('rejects wrong audience, cross-origin, missing origin and target substitution without granting access', async () => {
    const { forms } = await pageForms();
    expect((await post(forms[0], origin, visitorJwt)).status).toBe(403);
    expect((await post(forms[0], 'https://attacker.example.test')).status).toBe(403);
    expect((await request('/admin/decision', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: forms[0].toString() })).status).toBe(403);
    forms[0].set('id', 'another-target'); expect((await post(forms[0])).status).toBe(409);
    expect((await bridge.admission('status', { email: 'visitor@example.test' })).status).toBe('pending');
  });
});
