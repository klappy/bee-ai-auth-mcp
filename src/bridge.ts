/**
 * BeeBridge — the private-CA bridge as a bound Cloudflare Container (D0028, ledger
 * E0014). The relay Worker reaches it over an INTERNAL Worker->container call
 * (`getContainer(env.BEE_BRIDGE).fetch(...)`), never a public hostname. Inside the
 * container, caddy (see bridge/Dockerfile + bridge/Caddyfile) listens on
 * `defaultPort` and re-originates TLS to Bee trusting bee-ca.pem — the one thing a
 * stock Worker `fetch` cannot do because Bee's direct API uses a private CA
 * (ledger E0012).
 *
 * This class holds no application logic: it is a typed handle for the Cloudflare
 * Containers runtime whose only job is to pass the bridge's upstream config
 * (BEE_UPSTREAM/BEE_SNI) into the container, since a CF container does not inherit
 * the Worker's env. The bridge is still token-AGNOSTIC shared
 * infrastructure (multitenancy rule, E0014): every request carries its own user's
 * bearer in `Authorization`, passed straight through to Bee — never injected here,
 * never stored, never logged. There is one shared instance (the `getContainer`
 * default `cf-singleton-container`), so do NOT add per-user instance names — that
 * would shard a deliberately single, shared bridge.
 *
 * The runtime must SEE this class for the `migrations` entry (wrangler.jsonc
 * `new_sqlite_classes: ["BeeBridge"]`) to register the Durable Object, so it is
 * re-exported from src/index.ts.
 */

import { Container } from "@cloudflare/containers";
import type { Env } from "./types";

export class BeeBridge extends Container<Env> {
  /** caddy's internal listener (bridge/Caddyfile `:8080` site). The Worker's
   *  container fetch is forwarded here by the Containers runtime. */
  defaultPort = 8080;
  /** Idle the instance after inactivity; it cold-starts on the next request.
   *  whoami is bursty, not steady, so there is no value in holding it warm. */
  sleepAfter = "10m";

  /** A Cloudflare container does NOT inherit the Worker's vars/secrets, so caddy's
   *  {$BEE_UPSTREAM}/{$BEE_SNI} (bridge/Caddyfile) would start empty and the
   *  reverse_proxy to Bee would fail. Pass the operator-set secrets through as the
   *  container's environment. Token-AGNOSTIC still holds: no per-user bearer is set
   *  here — that rides the Authorization header per request, straight to Bee. */
  envVars = {
    BEE_UPSTREAM: this.env.BEE_UPSTREAM,
    BEE_SNI: this.env.BEE_SNI,
  };

  /** Cold-start signal (telemetry only — shape, not application logic). `onStart`
   *  fires when the container starts; the first request after a start is served
   *  "cold". We surface that to the Worker as an `x-bridge-cold` response header
   *  so telemetry can split the bimodal cold/warm latency (the whole point of the
   *  baseline). Read+cleared per request; the DO instance loses it on eviction,
   *  which is exactly a cold start. See docs/telemetry-governance.md. */
  private coldPending = false;

  override onStart(): void {
    this.coldPending = true;
  }

  override async fetch(request: Request): Promise<Response> {
    try {
      const res = await super.fetch(request);
      // onStart fires inside super.fetch on a cold start, so read the flag after.
      const cold = this.coldPending;
      const headers = new Headers(res.headers);
      headers.set("x-bridge-cold", cold ? "1" : "0");
      return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
    } finally {
      // Clear even when super.fetch throws, so a failed cold request can't leave
      // the flag set and mark later warm requests as cold in telemetry.
      this.coldPending = false;
    }
  }
}
