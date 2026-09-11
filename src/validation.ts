/** Separate entry point: preserves the real OAuth, MCP and CLI broker paths. */
import production from "./index";
import { BeeBridge as BaseBridge } from "./hosted-bridge";
import { getContainer } from "@cloudflare/containers";
import type { Env } from "./types";
import { validationClosed, validationExpiry, VALIDATION_REQUEST_LIMIT, type ValidationWindow } from "./validation-window";

import { privateTrialRoute } from "./validation-routes";
type ValidationEnv = Env & ValidationWindow;

// Same single bound class, but only this isolated config exports this subclass.
// Durable quota survives isolate eviction and serializes concurrent admissions.
export class BeeBridge extends BaseBridge {
  constructor(ctx: DurableObjectState<{}>, env: ValidationEnv) {
    super(ctx, { ...env, BEE_ENVIRONMENT: "staging" });
  }
  override async fetch(request: Request): Promise<Response> {
    if (validationExpiry(this.env as ValidationEnv) === null) return validationClosed();
    return super.fetch(request);
  }

  override async startBeeBroker(id: string) {
    if (validationExpiry(this.env as ValidationEnv) === null) return { status: "error" as const, message: "validation unavailable" };
    return super.startBeeBroker(id);
  }

  override async resumeBeeBroker(id: string) {
    if (validationExpiry(this.env as ValidationEnv) === null) return { status: "error" as const, message: "validation unavailable" };
    return super.resumeBeeBroker(id);
  }

  override async clearBeeBroker(id: string) {
    // Never restart an expired Container merely to claim transient cleanup.
    // Provider teardown/revocation remains separate and must be verified.
    if (validationExpiry(this.env as ValidationEnv) === null) return { status: "error" as const, message: "validation unavailable" };
    return super.clearBeeBroker(id);
  }

  async reserveValidationRequest(): Promise<boolean> {
    const expiry = validationExpiry(this.env as ValidationEnv);
    if (expiry === null) return false;
    const admitted = await this.ctx.storage.transaction(async txn => {
      if (await txn.get<boolean>("validation:stopped")) return false;
      const count = (await txn.get<number>("validation:requests")) ?? 0;
      if (count >= VALIDATION_REQUEST_LIMIT) return false;
      await txn.put("validation:requests", count + 1);
      return true;
    });
    if (!admitted) return false;
    // Scheduling is separate from quota mutation. Failure denies this request;
    // no expensive upstream call occurs without a scheduled shutdown receipt.
    if (!(await this.ctx.storage.get<boolean>("validation:shutdown-scheduled"))) {
      await this.schedule(new Date(expiry), "expireValidation");
      await this.ctx.storage.put("validation:shutdown-scheduled", true);
    }
    return validationExpiry(this.env as ValidationEnv) !== null;
  }

  async expireValidation(): Promise<void> {
    await this.ctx.storage.put("validation:stopped", true);
    await this.destroy();
  }
}

export default {
  async fetch(request: Request, env: ValidationEnv, ctx: ExecutionContext): Promise<Response> {
    // Check before any DO/KV/Container call, including public/static routes.
    if (validationExpiry(env) === null || !env.CONSENT_SIGNING_SECRET) return validationClosed();
    const route = privateTrialRoute(request);
    if (route) return route;
    try {
      const bridge = getContainer(env.BEE_BRIDGE as DurableObjectNamespace<BeeBridge>);
      if (!(await bridge.reserveValidationRequest())) return validationClosed();
    } catch {
      return validationClosed();
    }
    const response = await production.fetch(request, env, ctx);
    // Auth pages remain behind Access or signed consent state; malformed
    // requests do not publish branded error-page copy during this private trial.
    if (response.status >= 400 && response.headers.get('Content-Type')?.includes('text/html')) return validationClosed();
    return response;
  },
};
