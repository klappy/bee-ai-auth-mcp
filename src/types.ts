import type { OAuthHelpers } from "@cloudflare/workers-oauth-provider";

export interface Env {
  // ---- user<->relay leg: GitHub OAuth as the identity gate ----
  /** GitHub OAuth App client credentials (identity only — NOT a GitHub App, no minting). */
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  /** Comma-separated GitHub login(s) allowed to use this self-host instance.
   *  Self-host is single-operator: deny by default until this is set. */
  ALLOWED_GITHUB_LOGIN?: string;

  // ---- relay<->Bee leg: Model A, the deployer's own credential ----
  /** The deployer's Bee bearer token. Set via `wrangler secret put BEE_API_TOKEN`.
   *  NEVER logged, never returned, never serialized into an error. */
  BEE_API_TOKEN: string;
  /** Bee direct API base, e.g. https://<bee-api-host>. The /v1/* calls hang off this.
   *  NOTE: Bee's docs require a private CA for the direct API; standard Workers
   *  `fetch` trusts only public CAs. Reachability is the Phase-1 tripwire — see
   *  docs/phase-1-execution-handoff.md §4 before relying on this in production. */
  BEE_API_BASE: string;

  // ---- transport / misc ----
  /** Optional comma-separated extra origins allowed to call /mcp with an Origin header. */
  ALLOWED_ORIGINS?: string;
  /** Provider state: hashed OAuth grants. */
  OAUTH_KV: KVNamespace;
  /** Injected by OAuthProvider on the default handler. */
  OAUTH_PROVIDER: OAuthHelpers;
}

/** Decrypted per-grant props, set at authorization, delivered on every /mcp call.
 *  Model A carries identity only — no Bee token in props (it's a Worker secret). */
export interface GrantProps extends Record<string, unknown> {
  login: string;
}
