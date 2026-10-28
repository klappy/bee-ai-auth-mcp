import { describe, expect, it, vi } from 'vitest';
const calls = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock('cloudflare:workers', () => ({ WorkerEntrypoint: class {} }));
vi.mock('@cloudflare/containers', () => ({ getContainer: vi.fn() }));
vi.mock('../src/bridge', () => ({ BeeBridge: class {} }));
vi.mock('../src/bee-auth', () => ({ BeeAuthHandler: { fetch: vi.fn() } }));
vi.mock('../src/mcp-api', () => ({ McpApiHandler: { fetch: vi.fn() } }));
vi.mock('../src/actions-read', async original => ({ ...await original<typeof import('../src/actions-read')>(), handleActionsRead: calls.read }));
import production from '../src/hosted';
import staging from '../src/staging';
import type { Env } from '../src/types';

describe('machine route on current hosted entries', () => {
  it.each(['/v1/changes', '/v1/conversations/123'])('production forwards %s through the OIDC boundary', async path => {
    calls.read.mockResolvedValueOnce(new Response('boundary', { status: 401 }));
    const request = new Request('https://bee.invalid' + path);
    const response = await production.fetch(request, {} as Env, {} as ExecutionContext);
    expect(response.status).toBe(401);
    expect(calls.read).toHaveBeenLastCalledWith(request, expect.objectContaining({ BEE_ENVIRONMENT: 'production' }));
  });
  it('staging retains its environment identity at the shared boundary', async () => {
    calls.read.mockResolvedValueOnce(new Response('denied', { status: 403 }));
    const request = new Request('https://bee.invalid/v1/changes');
    expect((await staging.fetch(request, { SIGNUP_ENABLED: 'true' } as Env, {} as ExecutionContext)).status).toBe(403);
    expect(calls.read).toHaveBeenLastCalledWith(request, expect.objectContaining({ BEE_ENVIRONMENT: 'staging' }));
  });
});
