import { describe, it, expect, vi, beforeEach } from 'vitest';
const mocks = vi.hoisted(() => ({ verified: false, assets: vi.fn() }));
vi.mock('../src/access', () => ({ verifyAccessJwt: vi.fn(async () => mocks.verified) }));
vi.mock('../src/embedded-assets', () => ({ embeddedAssets: { fetch: mocks.assets } }));
vi.mock('../src/signup', () => ({ privatePage: (body: string, status = 200) => new Response(body, { status }) }));
import { preview } from '../src/hosted-homepage-preview';
import type { Env } from '../src/types';

const env = {} as Env; // No runtime window, Container or admission binding.
describe('protected homepage draft', () => {
  beforeEach(() => { mocks.verified = false; mocks.assets.mockReset(); });
  it('refuses unauthenticated access before reading assets', async () => {
    const response = await preview(new Request('https://staging.example/preview/'), env);
    expect(response.status).toBe(403);
    expect(await response.text()).not.toContain('Start free.');
    expect(mocks.assets).not.toHaveBeenCalled();
  });
  it.each(['/', '/index', '/index.html'])('serves review copy for verified home alias %s without a live Bee window', async path => {
    mocks.verified = true;
    const response = await preview(new Request('https://staging.example/preview' + path), env);
    const body = await response.text();
    expect(response.status).toBe(200);
    expect(body).toContain('Homepage draft — review only.');
    expect(body).toContain('Start free. Upgrade when you need more.');
    expect(body).not.toMatch(/free trial|lifetime|invitation|knowledge base/i);
    expect(body).toContain('value="https://staging.example/mcp"');
    expect(body).toContain('href="/preview/style.css"');
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex, nofollow, noarchive');
    expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
    expect(mocks.assets).not.toHaveBeenCalled();
  });
  it('HEAD has no body; mutation methods are refused', async () => {
    mocks.verified = true;
    expect(await (await preview(new Request('https://staging.example/preview/', { method: 'HEAD' }), env)).text()).toBe('');
    expect((await preview(new Request('https://staging.example/preview/', { method: 'POST' }), env)).status).toBe(405);
  });
  it('retains existing asset routing and strips conditional cache headers', async () => {
    mocks.verified = true;
    mocks.assets.mockResolvedValue(new Response('body {}', { headers: { 'Content-Type': 'text/css' } }));
    const response = await preview(new Request('https://staging.example/preview/style.css', { headers: { 'If-None-Match': '"old"' } }), env);
    expect(await response.text()).toBe('body {}');
    const request = mocks.assets.mock.calls[0][0] as Request;
    expect(new URL(request.url).pathname).toBe('/style.css');
    expect(request.headers.has('If-None-Match')).toBe(false);
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });
});
