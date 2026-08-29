import type { OAuthHelpers } from "@cloudflare/workers-oauth-provider";
import type { BeeBridge } from "./bridge";

export interface Env {
  // ---- user<->relay leg: GitHub OAuth as the identity gate ----
  /** GitHub OAuth App client credentials (identity only — NOT a GitHub App, no minting). */
  GITHUB_CLIENT_ID: string;
  /** Used ONLY for the GitHub OAuth code exchange (single-use again as of the
   *  dual-door change — consent-state signing and pairing-state sealing moved
   *  to CONSENT_SIGNING_SECRET; see ticket bee-relay-cf-access). */
  GITHUB_CLIENT_SECRET: string;
  /** Dedicated secret that HMAC-signs the consent round-trip state
   *  (src/state.ts signConsent/verifyConsent) and keys the sealed pairing
   *  state (src/pairing.ts, AES-GCM under HKDF). Introduced by the dual-door
   *  change to end GITHUB_CLIENT_SECRET's dual use. Hard switch: consent and
   *  pairing states live minutes; any in-flight round-trip at deploy moment
   *  restarts. Set via `wrangler secret put CONSENT_SIGNING_SECRET`. */
  CONSENT_SIGNING_SECRET: string;
  /** Comma-separated GitHub login(s) allowed to use this self-host instance.
   *  Tenancy is governed by this allow-list together with ALLOWED_EMAILS —
   *  two doors, two namespaces (PRD v0.3 / ledger E0012; ticket
   *  bee-relay-cf-access 2026-08-28 BOTH-doors ruling). */
  ALLOWED_GITHUB_LOGIN?: string;

  // ---- Cloudflare Access door (email identity beside GitHub OAuth) ----
  /** Zero Trust team domain, e.g. `myteam.cloudflareaccess.com`. Together with
   *  ACCESS_AUD this turns the Access door ON; unset/empty = door off, GitHub
   *  path unchanged. Certs are fetched from
   *  `https://<team>/cdn-cgi/access/certs`; issuer is pinned to `https://<team>`. */
  ACCESS_TEAM_DOMAIN?: string;
  /** The Access application's AUD tag (Zero Trust → Access → Applications).
   *  Pinned as the JWT audience — a token minted for another app is refused. */
  ACCESS_AUD?: string;
  /** Comma-separated email(s) allowed through the Access door. Lives BESIDE
   *  ALLOWED_GITHUB_LOGIN, never replacing it. Emails contain `@` and GitHub
   *  logins cannot, so the two namespaces are disjoint by construction. */
  ALLOWED_EMAILS?: string;

  // ---- relay<->Bee leg: per-grant encrypted custody (v0.3 amendment) ----
  // There is NO BEE_API_TOKEN Worker secret. Each user's Bee bearer is captured
  // at OAuth consent and held only inside THEIR encrypted grant props
  // (GrantProps.beeToken), decrypted in-Worker per request. See ledger E0012.
  /** The private-CA bridge, bound as a Cloudflare Container (D0028, ledger E0014).
   *  Replaces the old BEE_API_BASE public URL: the Worker reaches Bee via an
   *  INTERNAL Worker->container call (`getContainer(env.BEE_BRIDGE)`), so there is
   *  no public bridge hostname and no public cert. The container re-originates TLS
   *  to Bee trusting bee-ca.pem (Bee's direct API uses a private CA that a stock
   *  Worker `fetch` cannot trust). The /v1/* calls hang off this binding. See PRD
   *  v0.4 "The private-CA bridge", src/bridge.ts, and bridge/. */
  BEE_BRIDGE: DurableObjectNamespace<BeeBridge>;
  /** Bee's REAL direct-API endpoint for the bridge's re-originated TLS leg. A CF
   *  container does NOT inherit the Worker's env, so BeeBridge (src/bridge.ts)
   *  reads these and passes them to caddy as {$BEE_UPSTREAM}/{$BEE_SNI}
   *  (bridge/Caddyfile). Operator-set secrets — the real host is not publicly
   *  documented (from bee-cli config), so they are never committed. */
  /** Host:port of Bee's direct API (e.g. api.bee.computer:443). */
  BEE_UPSTREAM: string;
  /** Bee's hostname for SNI + cert validation (usually the upstream host). */
  BEE_SNI: string;

  // ---- transport / misc ----
  /** Optional comma-separated extra origins allowed to call /mcp with an Origin header. */
  ALLOWED_ORIGINS?: string;
  /** Provider state: hashed OAuth grants + token-wrapped encrypted props. */
  OAUTH_KV: KVNamespace;
  /** OPTIONAL telemetry sink (Analytics Engine). Unbound => every emit is a
   *  silent no-op (self-host respect). Records shape, never substance — see
   *  src/telemetry.ts and docs/telemetry-governance.md. */
  BEE_TELEMETRY?: AnalyticsEngineDataset;
  /** Injected by OAuthProvider on the default handler. */
  OAUTH_PROVIDER: OAuthHelpers;
}

/** Decrypted per-grant props, set at authorization, delivered on every /mcp call.
 *
 *  v0.3 per-grant custody: props carry BOTH the operator's identity (login) AND
 *  their Bee bearer (beeToken). workers-oauth-provider encrypts these props at
 *  rest with a per-encryption random AES-GCM key wrapped by
 *  HMAC-SHA256(public-constant, relay-token) — no master key, per-user isolated,
 *  a KV-dump alone is useless (verified at 0.7.2; ledger E0012). The token is
 *  plaintext only transiently in-Worker per request; it is NEVER logged, NEVER
 *  returned to the client, NEVER serialized into an error. */
export interface GrantProps extends Record<string, unknown> {
  /** The operator's identity: a GitHub login (GitHub door) OR an email
   *  (Cloudflare Access door). Emails contain `@` and GitHub logins cannot —
   *  disjoint by construction, so existing GitHub-login grants keep working
   *  untouched and no rekey/reconnect is forced (ticket bee-relay-cf-access,
   *  2026-08-28 amendment done-means). */
  login: string;
  /** The user's Bee bearer, captured at consent. Treated as a secret throughout. */
  beeToken: string;
}
