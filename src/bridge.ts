/**
 * BeeBridge — the private-CA bridge as a bound Cloudflare Container (D0028, ledger
 * E0014). The relay Worker reaches it over an INTERNAL Worker->container call
 * (`getContainer(env.BEE_BRIDGE).fetch(...)`), never a public hostname. Inside the
 * container, caddy (see bridge/Dockerfile + bridge/Caddyfile) listens on
 * `defaultPort` and re-originates TLS to Bee trusting bee-ca.pem — the one thing a
 * stock Worker `fetch` cannot do because Bee's direct API uses a private CA
 * (ledger E0012).
 *
 * This class is intentionally empty: it is a typed handle for the Cloudflare
 * Containers runtime, not application logic. The bridge is token-AGNOSTIC shared
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

export class BeeBridge extends Container {
  /** caddy's internal listener (bridge/Caddyfile `:8080` site). The Worker's
   *  container fetch is forwarded here by the Containers runtime. */
  defaultPort = 8080;
  /** Idle the instance after inactivity; it cold-starts on the next request.
   *  whoami is bursty, not steady, so there is no value in holding it warm. */
  sleepAfter = "10m";
}
