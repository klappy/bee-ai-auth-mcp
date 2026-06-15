/**
 * Live smoke battery — runs against a deployed base URL (SMOKE_BASE_URL).
 * Skips entirely when that env is unset, so `npm test` stays network-free.
 *
 * Deliberately does NOT exercise the Bee credential (whoami). That call needs a
 * captured per-grant Bee token and traverses the private-CA Container bridge —
 * it is validated manually, phone-only, three-pass, fresh-context, once the
 * bridge is deployed and BEE_API_BASE points at it (the DoD). Smoke proves only
 * what is honestly provable without secrets: the service is up, and the gated
 * API rejects the unauthenticated.
 */
import { describe, it, expect } from "vitest";

const BASE = process.env.SMOKE_BASE_URL;

describe.skipIf(!BASE)("live smoke", () => {
  it("/healthz returns 200 ok", async () => {
    const res = await fetch(`${BASE}/healthz`);
    expect(res.status).toBe(200);
    expect((await res.text()).trim()).toBe("ok");
  });

  it("/mcp rejects an unauthenticated request (not open, not crashing)", async () => {
    const res = await fetch(`${BASE}/mcp`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    });
    // OAuthProvider should refuse without a valid token; accept the auth-failure
    // family, reject success (200) and server error (5xx).
    expect([400, 401, 403]).toContain(res.status);
  });
});
