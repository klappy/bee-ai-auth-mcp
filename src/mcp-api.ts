/**
 * The gated /mcp API. OAuthProvider has verified the access token and decrypted
 * THIS grant's props into ctx.props before we run. v0.3 per-grant custody: props
 * carry identity (login) AND the user's Bee bearer (beeToken). The bearer is
 * read from the decrypted grant per request — never from env, never logged,
 * never returned.
 *
 * Phase 1 registers one tool: `whoami` over Bee GET /v1/me — the single
 * confirmed endpoint, and the live-credential smoke test for the all-surface
 * claim. Retrieval tools (Phase 2) are deferred.
 */

import { createMcpHandler } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getContainer } from "@cloudflare/containers";
import { beeGetMe } from "./bee";
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
        "Confirm this relay can reach Bee with your captured credential. Calls Bee GET /v1/me " +
        "and returns the account identity (read-only). This is the Phase-1 wire check: if it " +
        "succeeds over the connector on your phone, the all-surface path works. Your Bee token " +
        "is read from your encrypted grant and is never returned.",
      inputSchema: {},
    },
    async () => {
      // One shared, token-agnostic bridge: getContainer with no name resolves the
      // singleton ("cf-singleton-container"). Do NOT pass a per-user name — that
      // would shard the deliberately single shared bridge (multitenancy rule, E0014).
      const stub = getContainer(env.BEE_BRIDGE);
      const result = await beeGetMe(props.beeToken, stub);
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
    if (!props.beeToken) {
      // A grant from before the custody bend (login only). Force a reconnect so
      // the consent step can capture a Bee token into the encrypted props.
      return new Response(
        "Grant has no Bee credential. Disconnect and reconnect to supply your Bee token at consent.",
        { status: 403 }
      );
    }
    const handler = createMcpHandler(buildServer(env, props), { route: "/mcp" });
    return handler(request, env, ctx);
  },
};
