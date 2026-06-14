/**
 * bee-ai-auth-mcp — Phase 1 spine (Model A: deployer-key self-host).
 *
 * One deployment, one operator. "Connect GitHub" authenticates the operator
 * to THIS relay (the user<->relay leg). The Bee credential (relay<->Bee leg)
 * is the deployer's own Worker secret (BEE_API_TOKEN) — not collected per
 * user, not custodied for anyone else. Per-user custody is Tier 2 (deferred).
 *
 * Borrowed substrate (see docs/implementation-handoff.md):
 *   - OAuth 2.1 for MCP clients: `@cloudflare/workers-oauth-provider`
 *     (dynamic client registration, PKCE, hashed grants in OAUTH_KV)
 *   - MCP transport/envelope:    `agents` + `@modelcontextprotocol/sdk`
 *
 * No third party's credential is stored. The only state is the provider's
 * hashed OAuth grants. The Bee token lives as a Worker secret.
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
