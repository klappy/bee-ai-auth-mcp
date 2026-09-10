import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eligible, quotaMonth, quotaPolicy, quotaTransition, type QuotaState, type QuotaInput, type QuotaOperation } from '../src/quota';
import { admissionTransition, type AdmissionRecord, type AdmissionState } from '../src/admission';

const record: AdmissionRecord = { id: 'synthetic-account', email: 'person@example.test', status: 'pending', epoch: 0, createdAt: '2026-01-01', selfServiceEnrolled: true };
const policy = { limit: 2, version: 'monthly-v1' };
const start = Date.parse('2026-01-31T23:59:30Z');
function fixture() {
  const state: QuotaState = { periods: {}, reservations: {} };
  const user = { ...record };
  const run = (op: QuotaOperation, reservation?: string, now = start, p: ReturnType<typeof quotaPolicy> = policy, input: Partial<QuotaInput> = {}) => quotaTransition(state, user, p, op, { email: user.email, epoch: user.epoch, reservation, ...input }, now);
  return { state, user, run };
}
describe('monthly policy and eligibility', () => {
  it('has no implicit allowance, rejects malformed enabled config', () => {
    expect(quotaPolicy({})).toBeNull();
    for (const value of ['', '0', '-1', '2.5', '01', 'Infinity', '9007199254740992']) expect(quotaPolicy({ SELF_SERVICE_ENABLED: 'true', SELF_SERVICE_READ_LIMIT: value, SELF_SERVICE_POLICY_VERSION: 'v1' })).toBe('invalid');
    expect(quotaPolicy({ SELF_SERVICE_ENABLED: 'true', SELF_SERVICE_READ_LIMIT: '7', SELF_SERVICE_POLICY_VERSION: 'v1' })).toEqual({ limit: 7, version: 'v1' });
  });
  it('enrolls without manual approval, rollback preserves decisions, denied never revives', () => {
    const state: AdmissionState = { records: [] };
    const r = admissionTransition(state, 'enroll', { email: record.email }) as AdmissionRecord;
    expect(r.status).toBe('pending'); expect(eligible(r, policy)).toBe(true); expect(eligible(r, null)).toBe(false);
    r.status = 'approved'; expect(eligible(r, null)).toBe(true); expect(eligible(r, 'invalid')).toBe(false);
    r.status = 'denied'; admissionTransition(state, 'enroll', { email: record.email }); expect(eligible(r, policy)).toBe(false);
    expect(state.records).toHaveLength(1);
  });
  it.each([
    ['2028-02-29T23:59:59Z', '2028-03-01T00:00:00.000Z'],
    ['2027-02-28T23:59:59Z', '2027-03-01T00:00:00.000Z'],
    ['2026-12-31T23:59:59Z', '2027-01-01T00:00:00.000Z'],
  ])('UTC boundary %s', (now, renewal) => expect(quotaMonth(Date.parse(now)).renewsAt).toBe(renewal));
});
describe('atomic transitions', () => {
  it('counts reservation, commit once and refuses terminal reversal', () => {
    const { run } = fixture(); const id = run('reserve').reservation!;
    expect(run('usage')).toMatchObject({ used: 0, reserved: 1, remaining: 1 });
    expect(run('commit', id).ok).toBe(true); expect(run('commit', id).ok).toBe(true);
    expect(run('refund', id).ok).toBe(false); expect(run('usage')).toMatchObject({ used: 1, reserved: 0 });
    const second = run('reserve').reservation!; run('commit', second);
    expect(run('reserve')).toMatchObject({ ok: false, reason: 'allowance_exhausted', renewsAt: '2026-02-01T00:00:00.000Z' });
  });
  it('refunds once, cannot commit a refund, and expires late data', () => {
    const { run } = fixture(); const id = run('reserve').reservation!;
    expect(run('refund', id).ok).toBe(true); expect(run('refund', id).ok).toBe(true); expect(run('commit', id).ok).toBe(false);
    const late = run('reserve').reservation!; expect(run('commit', late, start + 120_000).ok).toBe(false);
    expect(run('usage', undefined, start + 120_000)).toMatchObject({ used: 0, reserved: 0 });
  });
  it('binds account and epoch, denial in flight discards data', () => {
    const { run, user } = fixture(); const id = run('reserve').reservation!;
    expect(run('commit', id, start, policy, { epoch: 1 }).ok).toBe(false);
    user.id = 'other'; expect(run('commit', id).ok).toBe(false); expect(run('refund', id).ok).toBe(false);
    user.id = record.id; user.status = 'denied'; expect(run('commit', id).ok).toBe(false);
    user.epoch++; user.status = 'approved'; expect(run('commit', id).ok).toBe(false);
  });
  it('snapshots policy through config/flag/client changes, renews only next month', () => {
    const { run } = fixture(); const id = run('reserve').reservation!;
    const next = { version: 'v2', limit: 20 };
    expect(run('usage', undefined, start, null).ok).toBe(false);
    expect(run('commit', id, start, next).ok).toBe(true);
    expect(run('usage', undefined, start, next)).toMatchObject({ used: 1, limit: 2, policy: 'monthly-v1' });
    expect(run('usage', undefined, start + 60_000, next)).toMatchObject({ used: 0, limit: 20, policy: 'v2' });
    expect(run('usage', undefined, start, next)).toMatchObject({ ok: false, reason: 'clock_unavailable' });
  });
  it('settles spanning requests against original month, never new month', () => {
    const { run, state } = fixture(); const old = run('reserve').reservation!;
    const refund = run('reserve').reservation!; const feb = start + 60_000;
    expect(run('reserve', undefined, feb).ok).toBe(true);
    expect(run('commit', old, feb).ok).toBe(true); expect(run('refund', refund, feb).ok).toBe(true);
    expect(state.periods['2026-01'].used).toBe(1);
    expect(run('usage', undefined, feb)).toMatchObject({ used: 0, reserved: 1, remaining: 1 });
    run('usage', undefined, feb + 180_000); expect(Object.keys(state.periods)).toEqual(['2026-02']);
    expect(run('commit', old, feb + 180_000).ok).toBe(false);
  });
});
