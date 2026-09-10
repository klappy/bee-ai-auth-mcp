import { test, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { SignJWT, exportJWK, generateKeyPair } from 'jose';
import { verifyAccessJwt, __resetJwksCacheForTests } from '../src/access';

const original = { ACCESS_TEAM_DOMAIN: '', ACCESS_AUD: '', STAGING_PREVIEW_AUD: '11479aab4d4f4d70aec0d82b1c04bbc1972e179a9cadee257c483f5fbebb2a75', VALIDATION_STARTS_AT: '', VALIDATION_EXPIRES_AT: '' };
const corrected = { ...original, ACCESS_TEAM_DOMAIN: 'klappy.cloudflareaccess.com' };
afterEach(() => { vi.unstubAllGlobals(); __resetJwksCacheForTests(); });
test('actual staging transform and real verifier: old provider config fails, repaired issuer succeeds, invalid tokens fail', async () => {
  const keys = await generateKeyPair('RS256');
  const jwk = { ...await exportJWK(keys.publicKey), kid: 'local-only', alg: 'RS256' };
  let certReads = 0;
  vi.stubGlobal('fetch', async (url: any) => {
    expect(String(url)).toBe('https://klappy.cloudflareaccess.com/cdn-cgi/access/certs');
    certReads++;
    return new Response(JSON.stringify({keys:[jwk]}), {headers:{'Content-Type':'application/json'}});
  });
  const mint = (aud = original.STAGING_PREVIEW_AUD, iss = 'https://klappy.cloudflareaccess.com') => new SignJWT({email:'synthetic@example.invalid'}).setProtectedHeader({alg:'RS256',kid:'local-only'}).setIssuer(iss).setAudience(aud).setIssuedAt().setExpirationTime('5m').sign(keys.privateKey);
  const transform = vm.runInNewContext(readFileSync('../../transform-staging.js','utf8')+';transformStaging');
  const source = transform('var validation_default = {\n  async fetch(request, env2, ctx) {\n return validationClosed();\n}};');
  const run = vm.runInNewContext(source+';validation_default.fetch', {Request,Response,Headers,URL,verifyAccessJwt,validationClosed:()=>new Response('closed',{status:503}),embeddedAssets:{fetch:async(r:Request)=>new URL(r.url).pathname==='/'?new Response('homepage',{headers:{'Content-Type':'text/html'}}):new Response(null,{status:404})}});
  const req = (token?:string,path='/') => new Request('https://bee-validation-20260909.klappy.workers.dev'+path,{headers:token?{'Cf-Access-Jwt-Assertion':token}:{}});
  const valid = await mint();
  expect((await run(req(valid),original,{})).status).toBe(503);
  expect(certReads).toBe(0);
  const success = await run(req(valid),corrected,{});
  expect(success.status).toBe(200);
  expect(await success.text()).toBe('homepage');
  expect(certReads).toBe(1);
  const imposter = await generateKeyPair('RS256');
  const badSignature = await new SignJWT({email:'synthetic@example.invalid'}).setProtectedHeader({alg:'RS256',kid:'local-only'}).setIssuer('https://klappy.cloudflareaccess.com').setAudience(original.STAGING_PREVIEW_AUD).setExpirationTime('5m').sign(imposter.privateKey);
  for (const token of [undefined,'malformed',badSignature,await mint('wrong-aud'),await mint(original.STAGING_PREVIEW_AUD,'https://wrong.example')]) expect((await run(req(token),corrected,{})).status).toBe(503);
  expect((await run(req(valid,'/mcp'),corrected,{})).status).toBe(503);
});
