import type { Env } from './types';
import { eligible, quotaPolicy } from './quota';

export type AdmissionRecord = { id: string; email: string; status: 'pending' | 'approved' | 'denied'; epoch: number; createdAt: string; trialEnrolled?: boolean };
export type AdmissionState = { records: AdmissionRecord[]; nonces?: Record<string, { owner: string; id: string; status: string; epoch?: number; expires: number }>; hour?: string; hourCount?: number; day?: string; dayCount?: number };
export type AdmissionOperation = 'signup' | 'enroll' | 'status' | 'list' | 'nonce' | 'decision' | 'dcr';
export const normalizeEmail = (email: string): string => email.trim().toLowerCase();

/** Pure transition, executed inside one DO storage transaction. Never starts a Container. */
export function admissionTransition(state: AdmissionState, op: AdmissionOperation, input: Record<string, string>, now = Date.now()): unknown {
  const email = normalizeEmail(input.email ?? '');
  if (op === 'dcr') {
    const day = new Date(now).toISOString().slice(0, 10), hour = new Date(now).toISOString().slice(0, 13);
    if (state.day !== day) { state.day = day; state.dayCount = 0; }
    if (state.hour !== hour) { state.hour = hour; state.hourCount = 0; }
    if ((state.dayCount ?? 0) >= 1000 || (state.hourCount ?? 0) >= 60) return false;
    state.dayCount = (state.dayCount ?? 0) + 1; state.hourCount = (state.hourCount ?? 0) + 1;
    return true;
  }
  if (op === 'list') return state.records;
  if (op === 'nonce') {
    // Keep one current action per owner/target/status. Reloading another tab
    // must not invalidate an open form, and old decisions must not overwrite
    // a newer approval epoch. Pruning keeps storage bounded to two per record.
    state.nonces = Object.fromEntries(Object.entries(state.nonces ?? {}).filter(([, n]) => n.owner === email && n.expires > now && state.records.some(r => r.id === n.id && r.epoch === n.epoch)));
    const tokens: Record<string, string> = {};
    for (const record of state.records) for (const status of ['approved', 'denied']) {
      const existingValue: string | undefined = Object.keys(state.nonces).find(key => state.nonces![key].id === record.id && state.nonces![key].status === status);
      const value: string = existingValue ?? crypto.randomUUID();
      if (!existingValue) state.nonces[value] = { owner: email, id: record.id, status, epoch: record.epoch, expires: now + 600_000 };
      tokens[`${record.id}:${status}`] = value;
    }
    return input.id ? tokens[`${input.id}:${input.status}`] ?? '' : tokens;
  }
  if (op === 'decision') {
    const nonce = state.nonces?.[input.nonce]; if (state.nonces) delete state.nonces[input.nonce];
    if (!nonce || nonce.owner !== email || nonce.id !== input.id || nonce.status !== input.status || nonce.expires <= now) return false;
    const record = state.records.find(r => r.id === input.id);
    if (!record || nonce.epoch !== record.epoch || !['approved', 'denied'].includes(input.status)) return false;
    if (record.status !== input.status) { record.epoch++; record.status = input.status as 'approved' | 'denied'; }
    return true;
  }
  const existing = state.records.find(r => r.email === email);
  if (op === 'enroll' && existing && existing.status !== 'denied') existing.trialEnrolled = true;
  if (op === 'status' || existing) return existing ?? null;
  if (!email || email.length > 254 || !email.includes('@')) return null;
  if (state.records.length >= 100) return null;
  const record: AdmissionRecord = { id: crypto.randomUUID(), email, status: 'pending', epoch: 0, createdAt: new Date(now).toISOString(), ...(op === 'enroll' ? { trialEnrolled: true } : {}) };
  state.records.push(record); return record;
}

interface AdmissionRpc { admission(op: AdmissionOperation, input: Record<string, string>): Promise<unknown>; reserveValidationRequest(): Promise<boolean> }
export function admissionStub(env: Env): AdmissionRpc {
  return env.BEE_BRIDGE.get(env.BEE_BRIDGE.idFromName('cf-singleton-container')) as unknown as AdmissionRpc;
}
export async function admissionRecord(env: Env, email: string, create = false): Promise<AdmissionRecord | null> {
  return await admissionStub(env).admission(create ? 'signup' : 'status', { email }) as AdmissionRecord | null;
}
export async function admissionAllowed(env: Env, email: string, epoch?: number): Promise<boolean> {
  try { return eligible(await admissionRecord(env, email), quotaPolicy(env), epoch); }
  catch { return false; }
}
/** Call only after fresh Access JWT verification, never from decrypted old grants. */
export async function enrollVerified(env: Env, email: string): Promise<AdmissionRecord | null> {
  const policy = quotaPolicy(env);
  if (policy === 'invalid') return null;
  return await admissionStub(env).admission(policy ? 'enroll' : 'signup', { email }) as AdmissionRecord | null;
}
export async function runtimeAllowed(env: Env): Promise<boolean> {
  if (env.SIGNUP_ENABLED !== 'true') return true;
  try { return await admissionStub(env).reserveValidationRequest(); } catch { return false; }
}
export function runtimePaused(): Response {
  return new Response(JSON.stringify({ error: 'temporarily_unavailable', error_description: 'The bounded staging Bee test window is paused. Signup and approval remain available.' }), { status: 503, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}
