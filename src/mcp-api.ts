/**
 * The gated /mcp API. OAuthProvider has verified the access token and decrypted
 * THIS grant's props into ctx.props before we run. v0.3 per-grant custody: props
 * carry identity (login) AND the user's Bee bearer (beeToken). The bearer is
 * read from the decrypted grant per request — never from env, never logged,
 * never returned.
 *
 * Tools: `whoami` (Phase 1, Bee GET /v1/me — the live-credential smoke check)
 * plus the Phase-2 read surface — `bee_docs` (serves the Bee-API-usage reference)
 * and `bee_read` (GET any /v1/* path, or POST to the allow-listed /v1/search/*;
 * read-only by construction). `bee_write` remains deferred to the write phase.
 */

import { createMcpHandler } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getContainer } from "@cloudflare/containers";
import { z } from "zod";
import { beeGetMe, beeRead } from "./bee";
import { BEE_API_USAGE_DOC } from "./bee-api-usage-doc";
import { classifyPath, deriveTenantKey, statusClassOf, withTelemetry } from "./telemetry";
import type { Env, GrantProps } from "./types";

function buildServer(env: Env, props: GrantProps, tenantKey: string): McpServer {
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
    withTelemetry(env, tenantKey, "whoami", (tele) => async () => {
      // One shared, token-agnostic bridge: getContainer with no name resolves the
      // singleton ("cf-singleton-container"). Do NOT pass a per-user name — that
      // would shard the deliberately single shared bridge (multitenancy rule, E0014).
      const stub = getContainer(env.BEE_BRIDGE);
      const result = await beeGetMe(props.beeToken, stub);
      // bridge_ms/bridge_state come from the bridge.fetch leg measured inside
      // bee.ts — not the whole call (which includes the body read). bridgeCold is
      // set for non-2xx too: a cold container can still return 401/403/5xx.
      tele.bridgeMs = result.bridgeMs;
      tele.statusClass = statusClassOf(result.ok ? 200 : result.status);
      tele.bridgeCold = result.bridgeCold;
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
    })
  );

  server.registerTool(
    "bee_docs",
    {
      title: "Bee API usage reference",
      annotations: {
        title: "Bee API usage reference",
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: false,
      },
      description:
        "Return the Bee API usage reference: which /v1/* read endpoints exist, how to shape paths and the search body, pagination/cursors, and what is excluded. Read this before calling bee_read.",
      inputSchema: {},
    },
    withTelemetry(env, tenantKey, "bee_docs", (tele) => async () => {
      tele.statusClass = "2xx"; // local doc, no network leg
      return {
        content: [{ type: "text" as const, text: BEE_API_USAGE_DOC }],
      };
    })
  );

  server.registerTool(
    "bee_read",
    {
      title: "Read from the Bee API",
      annotations: {
        title: "Read from the Bee API",
        readOnlyHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
      description:
        "Read from the Bee API through the relay (your Bee token is read from your encrypted grant — never shown). Give a `path` beginning with /v1/. A GET is issued for every path EXCEPT the /v1/search/* endpoints, which are POSTed with the `search` body. Read-only by construction: it never issues a mutating verb. See bee_docs for the endpoint list.",
      inputSchema: {
        path: z
          .string()
          .describe(
            "Bee API path beginning with /v1/ (e.g. /v1/conversations, /v1/conversations/:id, /v1/changes?cursor=..., /v1/search/conversations)."
          ),
        search: z
          .record(z.string(), z.unknown())
          .optional()
          .describe(
            "JSON body for the /v1/search/* endpoints only (e.g. { query, limit, cursor }); ignored for GET paths."
          ),
      },
    },
    withTelemetry(env, tenantKey, "bee_read", (tele) => async ({ path, search }: { path: string; search?: Record<string, unknown> }) => {
      tele.pathClass = classifyPath(path);
      const stub = getContainer(env.BEE_BRIDGE);
      const result = await beeRead(props.beeToken, stub, path, search);
      // bridge_ms/bridge_state come from the bridge.fetch leg measured inside
      // bee.ts — not the whole call (which includes the body read). bridgeCold is
      // set for non-2xx too: a cold container can still return 401/403/5xx.
      tele.bridgeMs = result.bridgeMs;
      tele.statusClass = statusClassOf(result.status);
      tele.bridgeCold = result.bridgeCold;
      if (!result.ok) {
        const wall = { error: "bee_read_failed", status: result.status, detail: result.message };
        return { content: [{ type: "text" as const, text: JSON.stringify(wall, null, 2) }], isError: true };
      }
      const payload = { status: result.status, truncated: result.truncated ?? false, body: result.body };
      return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
    })
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
    const tenantKey = await deriveTenantKey(env, props.login);
    const handler = createMcpHandler(buildServer(env, props, tenantKey), { route: "/mcp" });
    return handler(request, env, ctx);
  },
};
