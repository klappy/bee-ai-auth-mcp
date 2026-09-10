import { beforeEach, expect, it, vi } from 'vitest';
const calls = vi.hoisted(() => ({ tools: new Map<string, Function>(), container: vi.fn(), runtime: vi.fn(), verify: vi.fn() }));
vi.mock('cloudflare:workers', () => ({ WorkerEntrypoint: class {} }));
vi.mock('../src/validation', () => ({ BeeBridge: class {} }));
vi.mock('../src/access', () => ({ verifyAccessJwt: calls.verify }));
vi.mock('@cloudflare/containers', () => ({ getContainer: calls.container }));
vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({ McpServer: class { registerTool(name: string, _config: unknown, fn: Function) { calls.tools.set(name, fn); } } }));
vi.mock('agents/mcp', () => ({ createMcpHandler: () => async () => new Response('protocol ready') }));
import { BeeBridge } from '../src/staging';
import { McpApiHandler } from '../src/mcp-api';
import { signupHandler } from '../src/signup';
import { meteredRead } from '../src/quota';

function fixture(limit = '2') {
  const data = new Map<string, unknown>(); let tail = Promise.resolve();
  const txn = { get: async (key: string) => structuredClone(data.get(key)), put: async (key: string, value: unknown) => { data.set(key, structuredClone(value)); } };
  const bridge: any = Object.create(BeeBridge.prototype);
  const env: any = { SIGNUP_ENABLED: 'true', SELF_SERVICE_ENABLED: 'true', SELF_SERVICE_READ_LIMIT: limit, SELF_SERVICE_POLICY_VERSION: 'monthly-v1', CONSENT_SIGNING_SECRET: 'synthetic-signing', BEE_BRIDGE: { idFromName: (n: string) => n, get: () => bridge } };
  bridge.env = env; bridge.ctx = { storage: { ...txn, transaction: (fn: Function) => { const p = tail.then(() => fn(txn)); tail = p.then(() => {}, () => {}); return p; } } };
  bridge.reserveValidationRequest = calls.runtime;
  return { env, bridge, data };
}
const email = 'synthetic@example.test';
beforeEach(() => { vi.clearAllMocks(); calls.tools.clear(); vi.useFakeTimers(); vi.setSystemTime(Date.parse('2026-09-10T16:00:00Z')); calls.runtime.mockResolvedValue(true); calls.verify.mockResolvedValue({ email }); });
async function connected(env: any, bridge: any) {
  const record = await bridge.admission('enroll', { email });
  const props = { login: email, beeToken: 'synthetic-token', admissionEpoch: record.epoch };
  const request = new Request('https://staging.example.test/mcp');
  expect((await McpApiHandler.fetch(request, env, { props } as any)).status).toBe(200);
  return record;
}
const text = (r: any) => JSON.parse(r.content[0].text);
it('actual DO serializes last-credit concurrency and recreated instance retains identity accounting', async () => {
  const { env, bridge, data } = fixture('1'); const r = await bridge.admission('enroll', { email });
  const read = vi.fn(async () => ({ ok: true }));
  const results = await Promise.all(Array.from({ length: 10 }, () => meteredRead(env, email, r.epoch, read)));
  expect(results.filter(x => 'result' in x)).toHaveLength(1); expect(read).toHaveBeenCalledOnce();
  const otherClientEnv = { ...env, SELF_SERVICE_READ_LIMIT: '20', SELF_SERVICE_POLICY_VERSION: 'changed' };
  expect(await meteredRead(otherClientEnv, email, r.epoch, read)).toMatchObject({ error: 'allowance_exhausted' });
  expect((await bridge.quota('usage', { email, epoch: r.epoch })).used).toBe(1);
  expect(data.has(`quota:account:${r.id}`)).toBe(true);
});
it('actual MCP read charges success/pages, refunds failures, docs/setup cost zero, exhaustion preserves protocol', async () => {
  const { env, bridge } = fixture('3'); await connected(env, bridge);
  const fetch = vi.fn(async () => Response.json({ conversation: { id: 'synthetic', transcriptions: [{ utterances: Array.from({ length: 4 }, (_, id) => ({ id, text: 'synthetic '.repeat(900) })) }] } }));
  calls.container.mockReturnValue({ fetch });
  await calls.tools.get('bee_docs')!({}); expect(text(await calls.tools.get('bee_usage')!({})).used).toBe(0);
  const first = text(await calls.tools.get('bee_read')!({ path: '/v1/conversations/synthetic', chunk: 2 }));
  expect(first.body.conversation.transcriptions[0].utterances).toHaveLength(2);
  const second = text(await calls.tools.get('bee_read')!({ path: '/v1/conversations/synthetic', cursor: first.body.utterance_paging.next_cursor, chunk: 2 }));
  expect(second.body.conversation.transcriptions[0].utterances).toHaveLength(2);
  expect(text(await calls.tools.get('bee_usage')!({}))).toMatchObject({ used: 2, remaining: 1 });
  fetch.mockImplementationOnce(async () => new Response('synthetic failure', { status: 500 }));
  expect((await calls.tools.get('bee_read')!({ path: '/v1/facts' })).isError).toBe(true);
  expect(text(await calls.tools.get('bee_usage')!({}))).toMatchObject({ used: 2, remaining: 1 });
  fetch.mockImplementationOnce(async () => Response.json({ facts: [] }) as any);
  await calls.tools.get('bee_read')!({ path: '/v1/facts' });
  const exhausted = await calls.tools.get('bee_read')!({ path: '/v1/facts' });
  expect(text(exhausted)).toMatchObject({ error: 'allowance_exhausted', renewsAt: '2026-10-01T00:00:00.000Z' });
  expect(fetch).toHaveBeenCalledTimes(4); await connected(env, bridge); expect(calls.tools.has('bee_docs')).toBe(true);
});
it('usage and docs remain available after runtime expiry without Container calls', async () => {
  const { env, bridge } = fixture(); calls.runtime.mockResolvedValue(false); await connected(env, bridge);
  expect(text(await calls.tools.get('bee_usage')!({}))).toMatchObject({ ok: true, used: 0 });
  await calls.tools.get('bee_docs')!({}); expect(calls.runtime).not.toHaveBeenCalled(); expect(calls.container).not.toHaveBeenCalled();
  expect((await calls.tools.get('bee_read')!({ path: '/v1/facts' })).isError).toBe(true);
  expect((await calls.tools.get('whoami')!({})).isError).toBe(true); expect(calls.container).not.toHaveBeenCalled();
});
it('verified signup has own usage and disabled rollback does not silently approve', async () => {
  const { env, bridge } = fixture();
  const page = await signupHandler(new Request('https://staging.example.test/signup'), env);
  expect(await page!.text()).toContain('Connect your Bee');
  const r = await bridge.admission('status', { email }); expect(r.status).toBe('pending');
  env.SELF_SERVICE_ENABLED = 'false';
  const response = await McpApiHandler.fetch(new Request('https://staging.example.test/mcp'), env, { props: { login: email, beeToken: 'synthetic', admissionEpoch: r.epoch } } as any);
  expect(response.status).toBe(403); expect(calls.container).not.toHaveBeenCalled();
});
it('denial while upstream is running discards successful data; exception refunds once', async () => {
  const { env, bridge } = fixture(); const r = await connected(env, bridge);
  const result = await meteredRead(env, email, r.epoch, async () => {
    const nonce = await bridge.admission('nonce', { email: 'owner@example.test', id: r.id, status: 'denied' });
    await bridge.admission('decision', { email: 'owner@example.test', id: r.id, status: 'denied', nonce });
    return { ok: true, body: 'synthetic data' };
  });
  expect(result).toEqual({ error: 'unavailable' });
  const another = await bridge.admission('enroll', { email: 'other@example.test' });
  expect(await meteredRead(env, another.email, another.epoch, async () => { throw new Error('private synthetic diagnostic'); })).toEqual({ error: 'unavailable' });
  expect(await bridge.quota('usage', { email: another.email, epoch: another.epoch })).toMatchObject({ used: 0, reserved: 0 });
});
