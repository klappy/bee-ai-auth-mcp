import { describe, expect, it } from 'vitest';
import { admissionTransition, type AdmissionRecord, type AdmissionState } from '../src/admission';

describe('strong admission authority transitions', () => {
  const fresh = (): AdmissionState => ({ records: [] });
  const signup = (s: AdmissionState, email = 'person@example.test') => admissionTransition(s, 'signup', { email }) as AdmissionRecord;
  const decide = (s: AdmissionState, id: string, status: string) => {
    const nonce = admissionTransition(s, 'nonce', { email: 'owner@example.test', id, status }) as string;
    return admissionTransition(s, 'decision', { email: 'owner@example.test', nonce, id, status });
  };
  it('creates pending only from the supplied verified identity and normalizes duplicates', () => {
    const s = fresh(); const a = signup(s, ' Person@Example.Test '); const b = signup(s);
    expect(a.id).toBe(b.id); expect(s.records).toHaveLength(1); expect(a.status).toBe('pending'); expect(a.epoch).toBe(0);
  });
  it('enforces total signup cap including approved/denied records', () => {
    const s = fresh(); for (let i = 0; i < 100; i++) signup(s, `user${i}@example.test`);
    expect(admissionTransition(s, 'signup', { email: 'extra@example.test' })).toBeNull();
    decide(s, s.records[0].id, 'approved'); expect(admissionTransition(s, 'signup', { email: 'extra@example.test' })).toBeNull();
  });
  it('denial and reapproval advance epoch so old tokens cannot revive', () => {
    const s = fresh(), r = signup(s); expect(decide(s, r.id, 'approved')).toBe(true); const old = r.epoch;
    expect(decide(s, r.id, 'denied')).toBe(true); expect(r.epoch).toBeGreaterThan(old);
    expect(decide(s, r.id, 'approved')).toBe(true); expect(r.epoch).toBe(3);
  });
  it('first approval of an enrolled account keeps the grant epoch', () => {
    const s = fresh(), r = admissionTransition(s, 'enroll', { email: 'person@example.test' }) as AdmissionRecord;
    const grantEpoch = r.epoch;
    expect(decide(s, r.id, 'approved')).toBe(true); expect(r.status).toBe('approved'); expect(r.epoch).toBe(grantEpoch);
    expect(decide(s, r.id, 'denied')).toBe(true); expect(r.epoch).toBeGreaterThan(grantEpoch);
  });
  it('preserves reloaded forms until a decision, then rejects the old opposite action without rotating eligible grants', () => {
    const s = fresh(), r = admissionTransition(s, 'enroll', { email: 'person@example.test' }) as AdmissionRecord;
    const owner = 'owner@example.test';
    const first = admissionTransition(s, 'nonce', { email: owner }) as Record<string, string>;
    expect(admissionTransition(s, 'nonce', { email: owner })).toEqual(first);
    expect(admissionTransition(s, 'decision', { email: owner, id: r.id, status: 'approved', nonce: first[r.id + ':approved'] })).toBe(true);
    expect(r.epoch).toBe(0); expect(r.decisionRevision).toBe(1);
    expect(admissionTransition(s, 'decision', { email: owner, id: r.id, status: 'denied', nonce: first[r.id + ':denied'] })).toBe(false);
    expect(r.status).toBe('approved'); expect(r.epoch).toBe(0);
    const next = admissionTransition(s, 'nonce', { email: owner }) as Record<string, string>;
    expect(next[r.id + ':denied']).not.toBe(first[r.id + ':denied']);
    expect(admissionTransition(s, 'decision', { email: owner, id: r.id, status: 'approved', nonce: next[r.id + ':approved'] })).toBe(true);
    expect(r.epoch).toBe(0); expect(r.decisionRevision).toBe(2);
    expect(admissionTransition(s, 'decision', { email: owner, id: r.id, status: 'denied', nonce: next[r.id + ':denied'] })).toBe(false);
    expect(decide(s, r.id, 'denied')).toBe(true); expect(r.epoch).toBe(1);
    expect(decide(s, r.id, 'approved')).toBe(true); expect(r.epoch).toBe(2);
  });
  it('old records and nonce shapes default revision to zero but cannot replay after first accepted decision', () => {
    const s = fresh(), r = signup(s); r.status = 'approved';
    s.nonces = { legacy: { owner: 'owner@example.test', id: r.id, status: 'approved', epoch: 0, expires: Date.now() + 60_000 },
      stale: { owner: 'owner@example.test', id: r.id, status: 'denied', epoch: 0, expires: Date.now() + 60_000 } };
    expect(admissionTransition(s, 'decision', { email: 'owner@example.test', id: r.id, status: 'approved', nonce: 'legacy' })).toBe(true);
    expect(r.decisionRevision).toBe(1); expect(r.epoch).toBe(0);
    expect(admissionTransition(s, 'decision', { email: 'owner@example.test', id: r.id, status: 'denied', nonce: 'stale' })).toBe(false);
  });
  it('rejects forged, wrong-owner, expired, replayed and unknown-target decisions', () => {
    const s = fresh(), r = signup(s); const now = Date.now();
    const nonce = admissionTransition(s, 'nonce', { email: 'owner@example.test', id: r.id, status: 'approved' }, now) as string;
    expect(admissionTransition(s, 'decision', { email: 'attacker@example.test', nonce, id: r.id, status: 'approved' }, now)).toBe(false);
    expect(r.status).toBe('pending');
    const next = admissionTransition(s, 'nonce', { email: 'owner@example.test', id: r.id, status: 'approved' }, now) as string;
    const input = { email: 'owner@example.test', nonce: next, id: r.id, status: 'approved' };
    expect(admissionTransition(s, 'decision', input, now + 600_000)).toBe(false);
    input.nonce = admissionTransition(s, 'nonce', { email: input.email, id: r.id, status: 'approved' }, now) as string;
    expect(admissionTransition(s, 'decision', input, now)).toBe(true);
    expect(admissionTransition(s, 'decision', input, now)).toBe(false);
    expect(decide(s, 'other-user-id', 'denied')).toBe(false);
  });
  it('limits DCR globally and does not reset daily count each hour', () => {
    const s = fresh(), start = Date.parse('2026-09-10T00:00:00Z');
    for (let i = 0; i < 60; i++) expect(admissionTransition(s, 'dcr', {}, start)).toBe(true);
    expect(admissionTransition(s, 'dcr', {}, start)).toBe(false);
    expect(admissionTransition(s, 'dcr', {}, start + 3_600_000)).toBe(true);
    s.dayCount = 1000; expect(admissionTransition(s, 'dcr', {}, start + 3_600_000)).toBe(false);
  });
  it('binds the nonce to the exact target and decision', () => {
    const s = fresh(), a = signup(s), b = signup(s, 'second@example.test');
    let nonce = admissionTransition(s, 'nonce', { email: 'owner@example.test', id: a.id, status: 'approved' }) as string;
    expect(admissionTransition(s, 'decision', { email: 'owner@example.test', nonce, id: b.id, status: 'approved' })).toBe(false);
    nonce = admissionTransition(s, 'nonce', { email: 'owner@example.test', id: a.id, status: 'approved' }) as string;
    expect(admissionTransition(s, 'decision', { email: 'owner@example.test', nonce, id: a.id, status: 'denied' })).toBe(false);
    expect(a.status).toBe('pending'); expect(b.status).toBe('pending');
  });
});
