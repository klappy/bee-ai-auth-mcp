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
  return !!record && policy !== 'invalid' && record.status !== 'denied' && (epoch === undefined || record.epoch === epoch) && (record.status === 'approved' || (!!policy && record.selfServiceEnrolled === true));
}
export type Reservation = { account: string; epoch: number; month: string; policy: string; limit: number; expires: number; status: 'reserved' | 'committed' | 'refunded' };
export type Period = { used: number; limit: number; policy: string; renewsAt: string };
export type QuotaState = { latestMonth?: string; periods: Record<string, Period>; reservations: Record<string, Reservation> };
export type QuotaInput = { email: string; epoch: number; reservation?: string };
export type QuotaResult = { ok: boolean; reason?: string; reservation?: string; used?: number; reserved?: number; limit?: number; remaining?: number; policy?: string; renewsAt?: string };
export type QuotaOperation = 'usage' | 'reserve' | 'commit' | 'refund';
// Operational request lease, not an allowance reset or a commercial period.
const LEASE_MS = 120_000;
export function quotaMonth(now: number): { month: string; renewsAt: string } {
  const date = new Date(now);
  return { month: date.toISOString().slice(0, 7), renewsAt: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)).toISOString() };
}
export function quotaTransition(state: QuotaState, record: AdmissionRecord | null, policy: ReturnType<typeof quotaPolicy>, op: QuotaOperation, input: QuotaInput, now = Date.now()): QuotaResult {
  for (const [id, r] of Object.entries(state.reservations)) if (r.expires <= now) delete state.reservations[id];
  // Only the newest period and periods with an unexpired settlement lease stay.
  // The durable high-water mark prevents a rolled-back clock recreating a bucket.
  for (const month of Object.keys(state.periods)) if (month !== state.latestMonth && !Object.values(state.reservations).some(r => r.month === month)) delete state.periods[month];
  const r = input.reservation ? state.reservations[input.reservation] : undefined;
  if (op === 'refund') {
    if (!r || r.account !== record?.id || r.epoch !== input.epoch || r.status === 'committed') return { ok: false, reason: 'invalid_reservation' };
    r.status = 'refunded'; return { ok: true };
  }
  if (!policy || policy === 'invalid' || !eligible(record, policy, input.epoch)) return { ok: false, reason: 'unavailable' };
  if (op === 'commit') {
    const original = r && state.periods[r.month];
    if (!r || !original || r.account !== record!.id || r.epoch !== input.epoch || r.policy !== original.policy || r.limit !== original.limit || r.status === 'refunded') return { ok: false, reason: 'invalid_reservation' };
    if (r.status === 'reserved') { r.status = 'committed'; original.used++; }
    return { ok: true };
  }
  const { month, renewsAt } = quotaMonth(now);
  if (state.latestMonth && month < state.latestMonth) return { ok: false, reason: 'clock_unavailable' };
  state.latestMonth = month;
  const period = state.periods[month] ??= { used: 0, limit: policy.limit, policy: policy.version, renewsAt };
  const active = Object.values(state.reservations).filter(r => r.month === month && r.status === 'reserved').length;
  const usage = { used: period.used, reserved: active, limit: period.limit, remaining: Math.max(0, period.limit - period.used - active), policy: period.policy, renewsAt: period.renewsAt };
  if (op === 'usage') return { ok: true, ...usage };
  if (op === 'reserve') {
    if (usage.remaining === 0) return { ok: false, reason: 'allowance_exhausted', ...usage };
    const id = crypto.randomUUID();
    state.reservations[id] = { account: record!.id, epoch: input.epoch, month, policy: period.policy, limit: period.limit, expires: now + LEASE_MS, status: 'reserved' };
    return { ok: true, reservation: id };
  }
  return { ok: false, reason: 'invalid_operation' };
}
export interface QuotaRpc { quota(op: QuotaOperation, input: QuotaInput): Promise<QuotaResult> }
export function quotaStub(env: Env): QuotaRpc { return env.BEE_BRIDGE.get(env.BEE_BRIDGE.idFromName('cf-singleton-container')) as unknown as QuotaRpc; }
export async function ownUsage(env: Env, email: string, epoch: number): Promise<QuotaResult> {
  try { return await quotaStub(env).quota('usage', { email, epoch }); } catch { return { ok: false, reason: 'unavailable' }; }
}
export function quotaError(reason = 'unavailable', renewsAt?: string) {
  return { content: [{ type: 'text' as const, text: JSON.stringify({ error: reason, renewsAt, message: reason === 'allowance_exhausted' ? 'Your monthly read allowance is used up. Your connection remains saved; usage and reference information remain available.' : 'Read allowance could not be confirmed. No data was returned.' }) }], isError: true };
}
export async function meteredRead<T extends { ok: boolean }>(env: Env, email: string, epoch: number, read: () => Promise<T>): Promise<{ result: T } | { error: string; renewsAt?: string }> {
  const policy = quotaPolicy(env);
  if (!policy || !email.includes('@')) return { result: await read() };
  if (policy === 'invalid') return { error: 'unavailable' };
  const input: QuotaInput = { email, epoch };
  const stub = quotaStub(env);
  try {
    const reserved = await stub.quota('reserve', input);
    if (!reserved.ok || !reserved.reservation) return { error: reserved.reason ?? 'unavailable', renewsAt: reserved.renewsAt };
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
