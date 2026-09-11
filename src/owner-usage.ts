/** Optional staging calibration. No identities or per-call records are stored. */
import type { Env } from './types';

const outcomes = ['read_success', 'read_failure', 'blocked', 'docs', 'identity', 'error'] as const;
const paths = ['me', 'conversations', 'search', 'other', 'n/a'] as const;
const statuses = ['2xx', '4xx', '5xx', 'transport_fail', 'other', 'n/a'] as const;
export type OwnerOutcome = typeof outcomes[number];
export type OwnerObservation = { outcome: OwnerOutcome; pathClass?: string; statusClass?: string; durationMs: number; bridgeMs?: number; bytesOut: number };
type Measures = { count: number; durationMs: number; bridgeMs: number; bytesOut: number };
type Day = { outcomes: Partial<Record<OwnerOutcome, Measures>>; paths: Partial<Record<typeof paths[number], number>>; statuses: Partial<Record<typeof statuses[number], number>> };
export type OwnerUsageState = { days: Record<string, Day> };
export type OwnerUsageResult = { ok: false; error: 'unavailable' } | { ok: true; days?: Record<string, Day> };
export const OWNER_USAGE_KEY = 'observation:owner:daily';
export const OWNER_USAGE_DAYS = 31;
export const unavailable = (): OwnerUsageResult => ({ ok: false, error: 'unavailable' });
const bounded = (n: unknown): number => typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.min(n, Number.MAX_SAFE_INTEGER) : 0;
const sum = (a: number, b: unknown): number => Math.min(Number.MAX_SAFE_INTEGER, bounded(a) + bounded(b));

/** login must come from authenticated grant props, never client-supplied args. */
export function ownerUsageEnabled(env: Env, login: unknown): login is string {
  const owner = env.STAGING_OWNER_EMAIL?.trim().toLowerCase();
  return env.SIGNUP_ENABLED === 'true' && env.OWNER_USAGE_ENABLED === 'true' && !!owner && owner.includes('@') && typeof login === 'string' && login.trim().toLowerCase() === owner;
}

/** Rebuild only fixed fields, pruning on every permitted read/write. No idle deletion promise. */
export function ownerUsageTransition(state: OwnerUsageState, event?: OwnerObservation, now = Date.now()): OwnerUsageState {
  const today = new Date(now).toISOString().slice(0, 10);
  const oldest = new Date(Date.parse(today) - (OWNER_USAGE_DAYS - 1) * 86_400_000).toISOString().slice(0, 10);
  const days: Record<string, Day> = {};
  for (const [date, day] of Object.entries(state.days ?? {})) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < oldest || date > today) continue;
    const timestamp = Date.parse(date + 'T00:00:00Z');
    if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== date) continue;
    const clean: Day = { outcomes: {}, paths: {}, statuses: {} };
    for (const outcome of outcomes) if (day.outcomes?.[outcome]) {
      const m = day.outcomes[outcome]!;
      clean.outcomes[outcome] = { count: bounded(m.count), durationMs: bounded(m.durationMs), bridgeMs: bounded(m.bridgeMs), bytesOut: bounded(m.bytesOut) };
    }
    for (const path of paths) if (day.paths?.[path]) clean.paths[path] = bounded(day.paths[path]);
    for (const status of statuses) if (day.statuses?.[status]) clean.statuses[status] = bounded(day.statuses[status]);
    days[date] = clean;
  }
  if (event) {
    const outcome = outcomes.includes(event.outcome) ? event.outcome : 'error';
    const path = paths.find(p => p === event.pathClass) ?? 'n/a';
    const status = statuses.find(s => s === event.statusClass) ?? 'n/a';
    const day = days[today] ??= { outcomes: {}, paths: {}, statuses: {} };
    const m = day.outcomes[outcome] ??= { count: 0, durationMs: 0, bridgeMs: 0, bytesOut: 0 };
    m.count = sum(m.count, 1); m.durationMs = sum(m.durationMs, event.durationMs);
    m.bridgeMs = sum(m.bridgeMs, event.bridgeMs); m.bytesOut = sum(m.bytesOut, event.bytesOut);
    day.paths[path] = sum(day.paths[path] ?? 0, 1); day.statuses[status] = sum(day.statuses[status] ?? 0, 1);
  }
  return { days };
}

interface OwnerUsageRpc { ownerUsage(op: 'record' | 'read', login: string, event?: OwnerObservation): Promise<OwnerUsageResult> }
function stub(env: Env): OwnerUsageRpc {
  return env.BEE_BRIDGE.get(env.BEE_BRIDGE.idFromName('cf-singleton-container')) as unknown as OwnerUsageRpc;
}
export async function recordOwnerUsage(env: Env, login: string, event: OwnerObservation): Promise<void> {
  if (!ownerUsageEnabled(env, login)) return;
  try { await stub(env).ownerUsage('record', login, event); } catch { /* best effort, never a billing ledger */ }
}
export async function readOwnerUsage(env: Env, login: string): Promise<OwnerUsageResult> {
  if (!ownerUsageEnabled(env, login)) return unavailable();
  try { return await stub(env).ownerUsage('read', login); } catch { return unavailable(); }
}
