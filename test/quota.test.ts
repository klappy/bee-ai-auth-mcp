import { beforeEach, describe, expect, it, vi } from 'vitest';
import { eligible, quotaWeek, quotaPolicy, quotaTransition, type QuotaState, type QuotaInput, type QuotaOperation } from '../src/quota';
import { admissionTransition, type AdmissionRecord, type AdmissionState } from '../src/admission';

const record: AdmissionRecord = { id: 'synthetic-account', email: 'person@example.test', status: 'pending', epoch: 0, createdAt: '2026-01-01', selfServiceEnrolled: true };
const policy = { limit: 2, version: 'monthly-v1' };
// Sunday 23:59:30Z: 60 seconds later is Monday 00:00:30Z, a new weekly period.
const start = Date.parse('2026-02-01T23:59:30Z');
function fixture() {
  const state: QuotaState = { periods: {}, reservations: {} };
  const user = { ...record };
  const run = (op: QuotaOperation, reservation?: string, now = start, p: ReturnType<typeof quotaPolicy> = policy, input: Partial<QuotaInput> = {}) => quotaTransition(state, user, p, op, { email: user.email, epoch: user.epoch, reservation, ...input }, now);
  return { state, user, run };
}
describe('weekly policy and eligibility', () => {
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
    // Sunday 23:59:59Z renews next second (Monday 00:00Z); Monday 00:00:00Z starts a fresh week.
    ['2026-09-13T23:59:59Z', '2026-09-07', '2026-09-14T00:00:00.000Z'],
    ['2026-09-14T00:00:00Z', '2026-09-14', '2026-09-21T00:00:00.000Z'],
    // Year boundary inside a week: Thu 2026-12-31 belongs to the week of Mon 2026-12-28.
    ['2026-12-31T23:59:59Z', '2026-12-28', '2027-01-04T00:00:00.000Z'],
    // Leap day inside a week: Tue 2028-02-29 belongs to the week of Mon 2028-02-28.
    ['2028-02-29T12:00:00Z', '2028-02-28', '2028-03-06T00:00:00.000Z'],
  ])('UTC week boundary %s', (now, key, renewal) => expect(quotaWeek(Date.parse(now))).toEqual({ month: key, renewsAt: renewal }));
  it('week keys sort chronologically across a year boundary', () => expect(quotaWeek(Date.parse('2026-12-28T00:00:00Z')).month < quotaWeek(Date.parse('2027-01-04T00:00:00Z')).month).toBe(true));
});
describe('atomic transitions', () => {
  it('counts reservation, commit once and refuses terminal reversal', () => {
    const { run } = fixture(); const id = run('reserve').reservation!;
    expect(run('usage')).toMatchObject({ used: 0, reserved: 1, remaining: 1 });
    expect(run('commit', id).ok).toBe(true); expect(run('commit', id).ok).toBe(true);
    expect(run('refund', id).ok).toBe(false); expect(run('usage')).toMatchObject({ used: 1, reserved: 0 });
    const second = run('reserve').reservation!; run('commit', second);
    expect(run('reserve')).toMatchObject({ ok: false, reason: 'allowance_exhausted', renewsAt: '2026-02-02T00:00:00.000Z' });
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
  it('snapshots policy through config/flag/client changes, renews only next week', () => {
    const { run } = fixture(); const id = run('reserve').reservation!;
    const next = { version: 'v2', limit: 20 };
    expect(run('usage', undefined, start, null).ok).toBe(false);
    expect(run('commit', id, start, next).ok).toBe(true);
    expect(run('usage', undefined, start, next)).toMatchObject({ used: 1, limit: 2, policy: 'monthly-v1' });
    expect(run('usage', undefined, start + 60_000, next)).toMatchObject({ used: 0, limit: 20, policy: 'v2' });
    expect(run('usage', undefined, start, next)).toMatchObject({ ok: false, reason: 'clock_unavailable' });
  });
  it('settles spanning requests against original week, never new week', () => {
    const { run, state } = fixture(); const old = run('reserve').reservation!;
    const refund = run('reserve').reservation!; const feb = start + 60_000;
    expect(run('reserve', undefined, feb).ok).toBe(true);
    expect(run('commit', old, feb).ok).toBe(true); expect(run('refund', refund, feb).ok).toBe(true);
    expect(state.periods['2026-01-26'].used).toBe(1);
    expect(run('usage', undefined, feb)).toMatchObject({ used: 0, reserved: 1, remaining: 1 });
    run('usage', undefined, feb + 180_000); expect(Object.keys(state.periods)).toEqual(['2026-02-02']);
    expect(run('commit', old, feb + 180_000).ok).toBe(false);
  });
});
