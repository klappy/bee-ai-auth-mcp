import { hostedFetch } from './hosted-handler';
/** Isolated staging entry. No production configuration or image change. */
import { BeeBridge as ValidationBridge } from './validation';
import { preview } from './hosted-homepage-preview';
import { privatePage } from './signup';
import { validationExpiry, VALIDATION_REQUEST_LIMIT, type ValidationWindow } from './validation-window';
import type { Env } from './types';
import { ownerUsageEnabled, ownerUsageTransition, OWNER_USAGE_KEY, unavailable, type OwnerObservation, type OwnerUsageState, type OwnerUsageResult } from './owner-usage';

type StagingEnv = Env & ValidationWindow;
export class BeeBridge extends ValidationBridge {
  async ownerUsage(op: 'record' | 'read', login: string, event?: OwnerObservation): Promise<OwnerUsageResult> {
    if (!ownerUsageEnabled(this.env, login) || !['record', 'read'].includes(op) || (op === 'record' && !event)) return unavailable();
    return this.ctx.storage.transaction(async txn => {
      const count = (await txn.get<number>('signup:operations')) ?? 0;
      if (!Number.isSafeInteger(count) || count < 0 || count >= 100_000) return unavailable();
      await txn.put('signup:operations', count + 1);
      const state = (await txn.get<OwnerUsageState>(OWNER_USAGE_KEY)) ?? { days: {} };
      const next = ownerUsageTransition(state, op === 'record' ? event : undefined);
      await txn.put(OWNER_USAGE_KEY, next);
      return op === 'read' ? { ok: true, days: next.days } : { ok: true };
    });
  }
  override async reserveValidationRequest(): Promise<boolean> {
    const expiry = validationExpiry(this.env as StagingEnv);
    if (expiry === null) return false;
    const admitted = await this.ctx.storage.transaction(async txn => {
      const count = (await txn.get<number>('validation:requests')) ?? 0;
      if (count >= VALIDATION_REQUEST_LIMIT) return false;
      await txn.put('validation:requests', count + 1); return true;
    });
    if (!admitted) return false;
    const scheduleKey = `signup:shutdown:${expiry}`;
    if (!(await this.ctx.storage.get<boolean>(scheduleKey))) {
      await this.schedule(new Date(expiry), 'expireStagingValidation', expiry);
      await this.ctx.storage.put(scheduleKey, true);
    }
    return validationExpiry(this.env as StagingEnv) !== null;
  }
  async expireStagingValidation(scheduledExpiry: number): Promise<void> {
    const currentExpiry = Date.parse((this.env as StagingEnv).VALIDATION_EXPIRES_AT ?? '');
    if (currentExpiry !== scheduledExpiry || Date.now() < scheduledExpiry) return;
    await this.destroy();
  }
  override async expireValidation(): Promise<void> {
    // Historical alarms carry no payload. Never destroy a newer active window.
    if (validationExpiry(this.env as StagingEnv) !== null) return;
    await this.destroy();
  }
}

export { registrationValid } from './hosted-handler';
export default {
  async fetch(request: Request, env: StagingEnv, ctx: ExecutionContext): Promise<Response> {
    env = { ...env, BEE_ENVIRONMENT: 'staging' };
    if (env.SIGNUP_ENABLED !== 'true') return privatePage('Staging is not configured', 503);
    const path = new URL(request.url).pathname;
    if (path === '/preview' || path.startsWith('/preview/')) return preview(request, env);
    return hostedFetch(request, env, ctx);
  },
};
