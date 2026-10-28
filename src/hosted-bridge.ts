/** Shared storage RPCs; production adds no validation lifetime budget. */
import { BeeBridge as BaseBridge } from './bridge';
import { isStaging } from './types';
import { admissionTransition, type AdmissionOperation, type AdmissionState } from './admission';
import { quotaPolicy, quotaTransition, type QuotaOperation, type QuotaInput, type QuotaState, type QuotaResult } from './quota';

export class BeeBridge extends BaseBridge {
  async admission(op: AdmissionOperation, input: Record<string, string>): Promise<unknown> {
    if (op === 'enroll' && (!quotaPolicy(this.env) || quotaPolicy(this.env) === 'invalid')) return null;
    return this.ctx.storage.transaction(async txn => {
      const count = (await txn.get<number>('signup:operations')) ?? 0;
      if (isStaging(this.env) && count >= 100_000) throw new Error('Staging operation allowance exhausted');
      if (isStaging(this.env)) await txn.put('signup:operations', count + 1);
      const state = (await txn.get<AdmissionState>('signup:authority')) ?? { records: [] };
      const result = admissionTransition(state, op, input);
      await txn.put('signup:authority', state);
      return result;
    });
  }
  async quota(op: QuotaOperation, input: QuotaInput): Promise<QuotaResult> {
    return this.ctx.storage.transaction(async txn => {
      const count = (await txn.get<number>('signup:operations')) ?? 0;
      if (isStaging(this.env) && count >= 100_000) return { ok: false, reason: 'unavailable' };
      if (isStaging(this.env)) await txn.put('signup:operations', count + 1);
      const authority = (await txn.get<AdmissionState>('signup:authority')) ?? { records: [] };
      const record = authority.records.find(r => r.email === input.email.trim().toLowerCase()) ?? null;
      if (!record) return { ok: false, reason: 'unavailable' };
      const key = `quota:account:${record.id}`;
      const state = (await txn.get<QuotaState>(key)) ?? { periods: {}, reservations: {} };
      const result = quotaTransition(state, record, quotaPolicy(this.env), op, input);
      await txn.put(key, state);
      return result;
    });
  }
}
