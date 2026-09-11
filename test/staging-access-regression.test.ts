vi.mock('@cloudflare/containers', () => ({ getContainer: vi.fn() }));
import { test, expect, vi, afterEach } from 'vitest';
vi.mock('cloudflare:workers', () => ({ WorkerEntrypoint: class {} }));
vi.mock('../src/bridge', () => ({ BeeBridge: class {} }));
vi.mock('../src/mcp-api', () => ({ McpApiHandler: { fetch: vi.fn() } }));
vi.mock('../src/bee-auth', () => ({ BeeAuthHandler: { fetch: vi.fn() } }));
import entry from '../src/staging';
import { SignJWT, exportJWK, generateKeyPair } from 'jose';
import { __resetJwksCacheForTests } from '../src/access';

const original = { BEE_ENVIRONMENT: 'staging', SIGNUP_ENABLED: 'true', ACCESS_TEAM_DOMAIN: '', ACCESS_AUD: 'synthetic-signup-audience', STAGING_PREVIEW_AUD: 'synthetic-signup-audience', VALIDATION_STARTS_AT: '', VALIDATION_EXPIRES_AT: '' };
const corrected = { ...original, ACCESS_TEAM_DOMAIN: 'klappy.cloudflareaccess.com' };
afterEach(() => { vi.unstubAllGlobals(); __resetJwksCacheForTests(); });
test('current staging preview and real verifier: missing issuer fails, repaired issuer succeeds, invalid tokens fail', async () => {
  const keys = await generateKeyPair('RS256');
  const jwk = { ...await exportJWK(keys.publicKey), kid: 'local-only', alg: 'RS256' };
  let certReads = 0;
  vi.stubGlobal('fetch', async (url: any) => {
    expect(String(url)).toBe('https://klappy.cloudflareaccess.com/cdn-cgi/access/certs');
    certReads++;
    return new Response(JSON.stringify({keys:[jwk]}), {headers:{'Content-Type':'application/json'}});
  });
  const mint = (aud = original.STAGING_PREVIEW_AUD, iss = 'https://klappy.cloudflareaccess.com') => new SignJWT({email:'synthetic@example.invalid'}).setProtectedHeader({alg:'RS256',kid:'local-only'}).setIssuer(iss).setAudience(aud).setIssuedAt().setExpirationTime('5m').sign(keys.privateKey);
  const run = (request: Request, env: typeof original, _ctx: unknown) => entry.fetch(request, env as any, { waitUntil: () => {} } as unknown as ExecutionContext);
  const req = (token?:string,path='/preview/') => new Request('https://bee-validation-20260909.klappy.workers.dev'+path,{headers:token?{'Cf-Access-Jwt-Assertion':token}:{}});
  const valid = await mint();
  expect((await run(req(valid),original,{})).status).toBe(403);
  expect(certReads).toBe(0);
  const success = await run(req(valid),corrected,{});
  expect(success.status).toBe(200);
  expect(success.headers.get('Cache-Control')).toBe('private, no-store');
  expect(await success.text()).toContain('https://bee-validation-20260909.klappy.workers.dev/mcp');
  expect(certReads).toBe(1);
  const imposter = await generateKeyPair('RS256');
  const badSignature = await new SignJWT({email:'synthetic@example.invalid'}).setProtectedHeader({alg:'RS256',kid:'local-only'}).setIssuer('https://klappy.cloudflareaccess.com').setAudience(original.STAGING_PREVIEW_AUD).setExpirationTime('5m').sign(imposter.privateKey);
  for (const token of [undefined,'malformed',badSignature,await mint('wrong-aud'),await mint(original.STAGING_PREVIEW_AUD,'https://wrong.example')]) expect((await run(req(token),corrected,{})).status).toBe(403);
  // An Access JWT is not an MCP bearer grant. Closed runtime must not prevent
  // the current native public challenge and authorization metadata.
  const mcp = await run(req(valid,'/mcp'),corrected,{});
  expect(mcp.status).toBe(401);
  expect(mcp.headers.get('WWW-Authenticate')).toContain('/.well-known/oauth-protected-resource/mcp');
  expect((await run(req(undefined,'/.well-known/oauth-authorization-server'),corrected,{})).status).toBe(200);
});
