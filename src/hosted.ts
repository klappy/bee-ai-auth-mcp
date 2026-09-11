/** Production hosted entry: shared OAuth/signup, without validation expiry. */
import { hostedFetch } from './hosted-handler';
import type { Env } from './types';
import { embeddedAssets } from './embedded-assets';
import { BeeBridge as SharedBridge } from './hosted-bridge';
export class BeeBridge extends SharedBridge {
  constructor(ctx: DurableObjectState<{}>, env: Env) {
    super(ctx, { ...env, BEE_ENVIRONMENT: 'production' });
  }
}
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const path = new URL(request.url).pathname;
    // Known frozen public files only; protocol and identity routes always reach
    // the hosted handler, even if a future asset manifest contains that name.
    const protectedRoute = /^\/(?:mcp|authorize|callback|consent|pairing|signup|admin|register|token|healthz|version|preview|\.well-known)(?:\/|$)/.test(path);
    if (['GET', 'HEAD'].includes(request.method) && !protectedRoute) {
      const asset = await embeddedAssets.fetch(request);
      if (asset.status !== 404) return asset;
    }
    return hostedFetch(request, { ...env, BEE_ENVIRONMENT: 'production' }, ctx);
  },
};
