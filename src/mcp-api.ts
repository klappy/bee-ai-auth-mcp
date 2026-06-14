/**
 * The gated /mcp API. OAuthProvider has verified the access token and
 * decrypted this grant's props into ctx.props before we run. Model A: props
 * carry identity (login) only; the Bee credential is the Worker secret.
 *
 * Phase 1 registers one tool: `whoami` over Bee GET /v1/me — the single
 * confirmed endpoint, and the live-credential smoke test for the all-surface
 * claim. Retrieval tools (Phase 2) and per-user custody (Tier 2) are deferred.
 */

import { createMcpHandler } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { beeWhoami } from "./bee";
import type { Env, GrantProps } from "./types";

function buildServer(env: Env, props: GrantProps): McpServer {
  const server = new McpServer({ name: "bee-ai-auth-mcp", version: "0.1.0" });

  server.registerTool(
    "whoami",
    {
      title: "Confirm the Bee credential",
      annotations: {
        title: "Confirm the Bee credential",
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
      description:
        "Confirm this relay can reach Bee with the configured credential. Calls Bee GET /v1/me " +
        "and returns the account identity (read-only). This is the Phase-1 wire check: if it " +
        "succeeds over the connector on your phone, the all-surface path works. No secret is ever returned.",
      inputSchema: {},
    },
    async () => {
      const result = await beeWhoami(env);
      if (!result.ok) {
        const wall = {
          error: "bee_unreachable_or_rejected",
          status: result.status,
          detail: result.message,
        };
        return { content: [{ type: "text" as const, text: JSON.stringify(wall, null, 2) }], isError: true };
      }
      const payload = {
        connected_as: props.login, // who authenticated to the relay
        bee: result.account, // the Bee account /v1/me returned
      };
      return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
    }
  );

  return server;
}

export const McpApiHandler = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const props = (ctx as ExecutionContext & { props?: GrantProps }).props;
    if (!props?.login) {
      return new Response("Grant is not bound to an identity. Disconnect and reconnect.", { status: 403 });
    }
    const handler = createMcpHandler(buildServer(env, props), { route: "/mcp" });
    return handler(request, env, ctx);
  },
};
