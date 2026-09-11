import { beforeEach, expect, it, vi } from 'vitest';
const calls = vi.hoisted(() => ({ tools: new Map<string, Function>(), container: vi.fn(), runtime: vi.fn() }));
vi.mock('cloudflare:workers', () => ({ WorkerEntrypoint: class {} }));
vi.mock('../src/validation', () => ({ BeeBridge: class {} }));
vi.mock('@cloudflare/containers', () => ({ getContainer: calls.container }));
vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({ McpServer: class { registerTool(name: string, _config: unknown, fn: Function) { calls.tools.set(name, fn); } } }));
vi.mock('agents/mcp', () => ({ createMcpHandler: () => async () => new Response('ready') }));
import { BeeBridge } from '../src/staging';
import { McpApiHandler } from '../src/mcp-api';
import { ownerUsageTransition, OWNER_USAGE_KEY, recordOwnerUsage, readOwnerUsage } from '../src/owner-usage';
import { withTelemetry } from '../src/telemetry';
const owner = 'owner@example.test';
const event = { outcome: 'read_success' as const, pathClass: 'me', statusClass: '2xx', durationMs: 4, bridgeMs: 2, bytesOut: 7 };
function fixture() {
  const data = new Map<string, any>(); let tail = Promise.resolve();
  const txn = { get: async (key: string) => structuredClone(data.get(key)), put: async (key: string, value: unknown) => { data.set(key, structuredClone(value)); } };
  const bridge: any = Object.create(BeeBridge.prototype);
  const env: any = { SIGNUP_ENABLED: 'true', OWNER_USAGE_ENABLED: 'true', STAGING_OWNER_EMAIL: owner, BEE_TELEMETRY: { writeDataPoint: vi.fn() }, BEE_BRIDGE: { idFromName: (n: string) => n, get: () => bridge } };
  bridge.env = env; bridge.ctx = { storage: { transaction: (fn: Function) => { const p = tail.then(() => fn(txn)); tail = p.then(() => {}, () => {}); return p; } } }; bridge.reserveValidationRequest = calls.runtime;
  return { env, bridge, data };
}
beforeEach(() => { vi.clearAllMocks(); calls.tools.clear(); calls.runtime.mockResolvedValue(true); });
it.each([{ OWNER_USAGE_ENABLED: undefined }, { OWNER_USAGE_ENABLED: 'false' }, { STAGING_OWNER_EMAIL: '' }, { SIGNUP_ENABLED: undefined }])('disabled/missing bindings are no-op: %j', async patch => {
  const { env, bridge, data } = fixture(); Object.assign(env, patch);
  await recordOwnerUsage(env, owner, event); expect(await bridge.ownerUsage('read', owner)).toEqual({ ok: false, error: 'unavailable' }); expect(data.size).toBe(0);
});
it('private RPC rejects nonowner before reads or writes', async () => {
  const { bridge, data } = fixture();
  expect(await bridge.ownerUsage('record', 'other@example.test', event)).toEqual({ ok: false, error: 'unavailable' });
  expect(await bridge.ownerUsage('read', 'other@example.test')).toEqual({ ok: false, error: 'unavailable' }); expect(data.size).toBe(0);
});
it('concurrent actual DO transactions preserve counts and bounded operation allowance', async () => {
  const { bridge, data } = fixture();
  await Promise.all(Array.from({ length: 30 }, () => bridge.ownerUsage('record', owner, event)));
  const result = await bridge.ownerUsage('read', owner); const day: any = Object.values(result.days)[0];
  expect(day.outcomes.read_success).toEqual({ count: 30, durationMs: 120, bridgeMs: 60, bytesOut: 210 });
  expect(data.get('signup:operations')).toBe(31); data.set('signup:operations', 100_000);
  const previous = structuredClone(data.get(OWNER_USAGE_KEY));
  expect(await bridge.ownerUsage('record', owner, event)).toEqual({ ok: false, error: 'unavailable' });
  expect(await bridge.ownerUsage('read', owner)).toEqual({ ok: false, error: 'unavailable' }); expect(data.get(OWNER_USAGE_KEY)).toEqual(previous); expect(data.get('signup:operations')).toBe(100_000);
});
it('fixed schema strips identities/content, rejects metadata and bounds numbers', () => {
  const dirty: any = { ...event, outcome: 'secret-content', pathClass: '/v1/me?secret=abc', statusClass: 'owner@example.test', durationMs: Infinity, bridgeMs: -1, bytesOut: Number.MAX_VALUE, email: owner, token: 'private-token' };
  const state = ownerUsageTransition({ days: {} }, dirty, Date.parse('2026-09-11T12:00Z'));
  const serialized = JSON.stringify(state); for (const secret of [owner, 'secret-content', '/v1/', 'private-token']) expect(serialized).not.toContain(secret);
  expect(state.days['2026-09-11'].outcomes.error).toEqual({ count: 1, durationMs: 0, bridgeMs: 0, bytesOut: Number.MAX_SAFE_INTEGER });
});
it('read transition prunes to 31 UTC dates and discards future and unknown fields', () => {
  let state: any = { days: {} }; const today = Date.parse('2026-09-11T12:00Z');
  for (let age = 40; age >= 0; age--) state = ownerUsageTransition(state, event, today - age * 86400000);
  state.days['9999-01-01'] = {}; state.days['2026-09-11'].identity = owner;
  const clean = ownerUsageTransition(state, undefined, today); expect(Object.keys(clean.days)).toHaveLength(31); expect(clean.days['2026-08-11']).toBeUndefined(); expect(JSON.stringify(clean)).not.toContain(owner);
});
it('one wrapper preserves results, exact UTF8 bytes and thrown errors while isolating telemetry failures', async () => {
  const { env, bridge } = fixture(); const pending: Promise<unknown>[] = [];
  const observe = { login: owner, waitUntil: (p: Promise<unknown>) => { pending.push(p); } };
  const result = { content: [{ type: 'text', text: 'é🐝' }] };
  expect(await withTelemetry(env, '', 'bee_read', tele => async () => { tele.readSucceeded = true; return result; }, observe)()).toBe(result);
  const failure = new Error('synthetic private diagnostic');
  await expect(withTelemetry(env, '', 'bee_read', () => async () => { throw failure; }, observe)()).rejects.toBe(failure);
  await Promise.all(pending); const usage: any = await readOwnerUsage(env, owner); const day: any = Object.values(usage.days)[0];
  expect(day.outcomes.read_success.bytesOut).toBe(6); expect(day.outcomes.error.count).toBe(1);
  expect(env.BEE_TELEMETRY.writeDataPoint).not.toHaveBeenCalled();
  bridge.ownerUsage = vi.fn().mockRejectedValue(new Error('storage failure'));
  expect(await withTelemetry(env, '', 'bee_docs', () => async () => result, observe)()).toBe(result); await Promise.all(pending);
});
it('production retains AE path and does not invoke staging RPC', async () => {
  const { env, bridge } = fixture(); env.SIGNUP_ENABLED = undefined; const rpc = vi.spyOn(bridge, 'ownerUsage'); const result = { content: [{ text: 'test' }] };
  expect(await withTelemetry(env, 'synthetic-tenant', 'bee_docs', () => async () => result)()).toBe(result);
  expect(env.BEE_TELEMETRY.writeDataPoint).toHaveBeenCalledOnce(); expect(rpc).not.toHaveBeenCalled();
});
async function connect(env: any, bridge: any, login = owner) {
  bridge.admission = vi.fn().mockResolvedValue({ status: 'approved', epoch: 1 }); const pending: Promise<unknown>[] = [];
  const cryptoSpy = vi.spyOn(crypto.subtle, 'importKey');
  const r = await McpApiHandler.fetch(new Request('https://staging.example.test/mcp?login=owner@example.test'), env, { props: { login, admissionEpoch: 1, beeToken: 'synthetic' }, waitUntil: (p: Promise<unknown>) => pending.push(p) } as any);
  expect(r.status).toBe(200); expect(cryptoSpy).not.toHaveBeenCalled(); cryptoSpy.mockRestore(); return pending;
}
it('actual MCP separates successful pages, returned errors, docs, identity and runtime blocks; usage does not self count', async () => {
  const { env, bridge } = fixture(); const pending = await connect(env, bridge);
  calls.container.mockReturnValue({ fetch: vi.fn().mockResolvedValue(Response.json({ synthetic: true })) });
  await calls.tools.get('bee_docs')!({}); await calls.tools.get('bee_read')!({ path: '/v1/me' });
  calls.container.mockReturnValue({ fetch: vi.fn().mockResolvedValue(new Response('failure', { status: 500 })) });
  await calls.tools.get('bee_read')!({ path: '/v1/me' }); await calls.tools.get('whoami')!({});
  calls.runtime.mockResolvedValue(false); await calls.tools.get('bee_read')!({ path: '/v1/me' });
  await Promise.all(pending); calls.container.mockClear(); calls.runtime.mockClear();
  const usage = JSON.parse((await calls.tools.get('bee_observed_usage')!({ login: 'other@example.test' })).content[0].text); const day: any = Object.values(usage.days)[0];
  for (const outcome of ['docs', 'read_success', 'read_failure', 'identity', 'blocked']) expect(day.outcomes[outcome].count).toBe(1);
  expect(calls.container).not.toHaveBeenCalled(); expect(calls.runtime).not.toHaveBeenCalled(); expect(pending).toHaveLength(5);
});
it('nonowner cannot select owner through request or tool args, no inspection tool or writes', async () => {
  const { env, bridge, data } = fixture(); const pending = await connect(env, bridge, 'other@example.test');
  expect(calls.tools.has('bee_observed_usage')).toBe(false); await calls.tools.get('bee_docs')!({ login: owner }); await Promise.all(pending); expect(data.size).toBe(0); expect(env.BEE_TELEMETRY.writeDataPoint).not.toHaveBeenCalled();
});
it('existing bee_docs compatibility keeps exact reference and inspection never counts itself or starts Bee', async () => {
  const { env, bridge, data } = fixture(); const pending = await connect(env, bridge);
  const docs = calls.tools.get('bee_docs')!;
  const { BEE_API_USAGE_DOC } = await import('../src/bee-api-usage-doc');
  expect((await docs({})).content[0].text).toBe(BEE_API_USAGE_DOC);
  expect((await docs({ view: 'reference' })).content[0].text).toBe(BEE_API_USAGE_DOC);
  await Promise.all(pending); const before = structuredClone(data.get(OWNER_USAGE_KEY));
  const usage = JSON.parse((await docs({ view: 'observed_usage' })).content[0].text);
  expect(usage.ok).toBe(true); expect(usage.days).toEqual(before.days);
  expect(data.get(OWNER_USAGE_KEY)).toEqual(before); expect(pending).toHaveLength(2);
  expect(calls.container).not.toHaveBeenCalled(); expect(calls.runtime).not.toHaveBeenCalled();
  expect((await docs({ view: 'unknown' })).isError).toBe(true); expect(pending).toHaveLength(2);
});
it.each(['nonowner', 'disabled'])('existing docs inspection denies %s without aggregate or writes', async mode => {
  const { env, bridge, data } = fixture();
  if (mode === 'disabled') env.OWNER_USAGE_ENABLED = 'false';
  const pending = await connect(env, bridge, mode === 'nonowner' ? 'other@example.test' : owner);
  const result = await calls.tools.get('bee_docs')!({ view: 'observed_usage', login: owner });
  expect(result.isError).toBe(true); expect(JSON.parse(result.content[0].text).days).toBeUndefined();
  expect(data.size).toBe(0); expect(pending).toHaveLength(0); expect(calls.container).not.toHaveBeenCalled(); expect(calls.runtime).not.toHaveBeenCalled();
});
