import { beforeEach, expect, it, vi } from 'vitest';
const calls = vi.hoisted(() => ({ status: vi.fn(), reserve: vi.fn(), container: vi.fn(), handler: vi.fn() }));
vi.mock('@cloudflare/containers', () => ({ getContainer: calls.container }));
vi.mock('agents/mcp', () => ({ createMcpHandler: calls.handler }));
import { McpApiHandler } from '../src/mcp-api';
const request = new Request('https://staging.example.test/mcp', { method: 'POST', body: '{}' });
function env(): any { return { SIGNUP_ENABLED: 'true', BEE_BRIDGE: { idFromName: (name: string) => name, get: () => ({ admission: calls.status, reserveValidationRequest: calls.reserve }) } }; }
beforeEach(() => { vi.clearAllMocks(); calls.status.mockResolvedValue(null); calls.reserve.mockResolvedValue(false); });
it.each([null, { status: 'pending', epoch: 0 }, { status: 'denied', epoch: 2 }, { status: 'approved', epoch: 3 }])('rejects existing grant unless current strong epoch matches: %j', async state => {
  calls.status.mockResolvedValue(state);
  const response = await McpApiHandler.fetch(request, env(), { props: { login: 'person@example.test', beeToken: 'synthetic', admissionEpoch: 1 } } as any);
  expect(response.status).toBe(403); expect(calls.container).not.toHaveBeenCalled(); expect(calls.handler).not.toHaveBeenCalled(); expect(calls.reserve).not.toHaveBeenCalled();
});
it('approved grant reaches protocol dispatch without reserving a costly runtime attempt', async () => {
  calls.status.mockResolvedValue({ status: 'approved', epoch: 1 });
  calls.handler.mockReturnValue(async () => new Response('synthetic protocol', { status: 200 }));
  const response = await McpApiHandler.fetch(request, env(), { props: { login: 'person@example.test', beeToken: 'synthetic', admissionEpoch: 1 } } as any);
  expect(response.status).toBe(200); expect(calls.reserve).not.toHaveBeenCalled(); expect(calls.container).not.toHaveBeenCalled(); expect(calls.handler).toHaveBeenCalledOnce();
  // Real SDK dispatch and closed expensive tools are covered by native-mcp.test.ts.
});
