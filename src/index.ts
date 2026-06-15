/**
 * bee-ai-auth-mcp — Phase 1 spine (v0.3: per-grant encrypted custody, single-tenant).
 *
 * One deployment, one operator (tenancy = the GitHub allow-list, kept at one
 * login). "Connect GitHub" authenticates the operator to THIS relay (the
 * user<->relay leg) and gates tenancy. The Bee credential (relay<->Bee leg) is
 * captured at a consent step and held only inside that user's encrypted grant
 * props (GrantProps.beeToken) — there is NO shared BEE_API_TOKEN Worker secret.
 * Architecture is multi-tenant-capable; the allow-list keeps it single-tenant.
 *
 * Borrowed substrate (see docs/implementation-handoff.md):
 *   - OAuth 2.1 for MCP clients: `@cloudflare/workers-oauth-provider`
 *     (dynamic client registration, PKCE, hashed grants in OAUTH_KV; props are
 *      encrypted per-grant with a token-wrapped key — no master key, verified
 *      at 0.7.2, ledger E0012)
 *   - MCP transport/envelope:    `agents` + `@modelcontextprotocol/sdk`
 *
 * State is the provider's hashed OAuth grants + each user's token-wrapped
 * encrypted props. The relay<->Bee leg also traverses a private-CA Container
 * bridge (see bridge/) because Bee's direct API uses a private CA.
 */

import OAuthProvider from "@cloudflare/workers-oauth-provider";
import { BeeAuthHandler } from "./bee-auth";
import { McpApiHandler } from "./mcp-api";
import { isOriginAllowed } from "./origin";
import type { Env } from "./types";

const provider = new OAuthProvider({
  apiRoute: "/mcp",
  apiHandler: McpApiHandler,
  defaultHandler: BeeAuthHandler,
  authorizeEndpoint: "/authorize",
  tokenEndpoint: "/token",
  clientRegistrationEndpoint: "/register",
  scopesSupported: ["bee_read"],
});

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Response | Promise<Response> {
    // Origin-header validation, scoped to the gated /mcp API (see src/origin.ts).
    // Configurable per deployment via ALLOWED_ORIGINS — non-browser MCP clients
    // (Claude infra, Cursor, curl) send no Origin and pass. OPTIONS preflights
    // pass through; the request that follows is judged.
    if (
      request.method !== "OPTIONS" &&
      new URL(request.url).pathname.startsWith("/mcp") &&
      !isOriginAllowed(request.headers.get("Origin"), request.url, env.ALLOWED_ORIGINS)
    ) {
      return new Response("Forbidden: cross-origin request rejected", { status: 403 });
    }
    return provider.fetch(request, env, ctx);
  },
};
