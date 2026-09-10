import type { Env } from './types';
import type { AdmissionRecord } from './admission';

export type QuotaPolicy = { version: string; limit: number };
export function quotaPolicy(env: Pick<Env, 'SELF_SERVICE_ENABLED' | 'SELF_SERVICE_READ_LIMIT' | 'SELF_SERVICE_POLICY_VERSION'>): QuotaPolicy | null | 'invalid' {
  if (env.SELF_SERVICE_ENABLED !== 'true') return null;
  const value = env.SELF_SERVICE_READ_LIMIT ?? '', version = env.SELF_SERVICE_POLICY_VERSION ?? '';
  const limit = Number(value);
  return /^[1-9]\d*$/.test(value) && Number.isSafeInteger(limit) && /^[A-Za-z0-9._-]{1,80}$/.test(version) ? { limit, version } : 'invalid';
}
export function eligible(record: AdmissionRecord | null, policy: ReturnType<typeof quotaPolicy>, epoch?: number): boolean {
  return !!record && policy !== 'invalid' && record.status !== 'denied' && (epoch === undefined || record.epoch === epoch) && (record.status === 'approved' || (!!policy && record.trialEnrolled === true));
}
export type Reservation = { account: string; epoch: number; policy: string; limit: number; expires: number; status: 'reserved' | 'committed' | 'refunded' };
export type QuotaState = { used: number; reservations: Record<string, Reservation> };
export type QuotaInput = { email: string; epoch: number; reservation?: string };
export type QuotaResult = { ok: boolean; reason?: string; reservation?: string; used?: number; limit?: number; remaining?: number; policy?: string };
export type QuotaOperation = 'usage' | 'reserve' | 'commit' | 'refund';
// Operational request lease, not an allowance reset or a commercial period.
const LEASE_MS = 120_000;
export function quotaTransition(state: QuotaState, record: AdmissionRecord | null, policy: ReturnType<typeof quotaPolicy>, op: QuotaOperation, input: QuotaInput, now = Date.now()): QuotaResult {
  for (const [id, r] of Object.entries(state.reservations)) if (r.expires <= now) delete state.reservations[id];
  const r = input.reservation ? state.reservations[input.reservation] : undefined;
  if (op === 'refund') {
    if (!r || r.account !== record?.id || r.epoch !== input.epoch || r.status === 'committed') return { ok: false, reason: 'invalid_reservation' };
    r.status = 'refunded'; return { ok: true };
  }
  if (!policy || policy === 'invalid' || !eligible(record, policy, input.epoch)) return { ok: false, reason: 'unavailable' };
  const active = Object.values(state.reservations).filter(r => r.status === 'reserved').length;
  const usage = { used: state.used, limit: policy.limit, remaining: Math.max(0, policy.limit - state.used - active), policy: policy.version };
  if (op === 'usage') return { ok: true, ...usage };
  if (op === 'reserve') {
    if (usage.remaining === 0) return { ok: false, reason: 'allowance_exhausted', ...usage };
    const id = crypto.randomUUID();
    state.reservations[id] = { account: record!.id, epoch: input.epoch, policy: policy.version, limit: policy.limit, expires: now + LEASE_MS, status: 'reserved' };
    return { ok: true, reservation: id };
  }
  if (!r || r.account !== record!.id || r.epoch !== input.epoch || r.policy !== policy.version || r.limit !== policy.limit || r.status === 'refunded') return { ok: false, reason: 'invalid_reservation' };
  if (r.status === 'reserved') { r.status = 'committed'; state.used++; }
  return { ok: true };
}
export interface QuotaRpc { quota(op: QuotaOperation, input: QuotaInput): Promise<QuotaResult> }
export function quotaStub(env: Env): QuotaRpc { return env.BEE_BRIDGE.get(env.BEE_BRIDGE.idFromName('cf-singleton-container')) as unknown as QuotaRpc; }
export async function ownUsage(env: Env, email: string, epoch: number): Promise<QuotaResult> {
  try { return await quotaStub(env).quota('usage', { email, epoch }); } catch { return { ok: false, reason: 'unavailable' }; }
}
export function quotaError(reason = 'unavailable') {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: reason, message: reason === 'allowance_exhausted' ? 'Your read allowance is used up. Your connection remains saved; usage and reference information remain available.' : 'Read allowance could not be confirmed. No data was returned.' }) }], isError: true };
}
export async function meteredRead<T extends { ok: boolean }>(env: Env, email: string, epoch: number, read: () => Promise<T>): Promise<{ result: T } | { error: string }> {
  const policy = quotaPolicy(env);
  if (!policy || !email.includes('@')) return { result: await read() };
  if (policy === 'invalid') return { error: 'unavailable' };
  const input: QuotaInput = { email, epoch };
  const stub = quotaStub(env);
  try {
    const reserved = await stub.quota('reserve', input);
    if (!reserved.ok || !reserved.reservation) return { error: reserved.reason ?? 'unavailable' };
    input.reservation = reserved.reservation;
    const result = await read();
    const settled = await stub.quota(result.ok ? 'commit' : 'refund', input);
    if (!settled.ok) return { error: 'unavailable' };
    return { result };
  } catch {
    if (input.reservation) { try { await stub.quota('refund', input); } catch { /* Lease expires; never release uncertain data. */ } }
    return { error: 'unavailable' };
  }
}
