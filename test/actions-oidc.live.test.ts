/**
 * Live OIDC repo-gate check — proves the Actions seat enforces klappy/refinery.
 *
 * Runs in CI on this repo with a real GitHub Actions OIDC token. The token's
 * repository is klappy/bee-ai-auth-mcp (not refinery), so a healthy gate returns
 * 403 oidc_not_accepted — not 401 missing_bearer. That is the honest live proof
 * until klappy/refinery's watcher calls a deploy that includes this seat.
 *
 * Skips when SMOKE_BASE_URL is unset (same guard as smoke.live.test.ts).
 */
import { describe, it, expect } from "vitest";

const BASE = process.env.SMOKE_BASE_URL;

async function fetchOidcToken(audience: string): Promise<string | null> {
  const reqUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
  const reqToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  if (!reqUrl || !reqToken) return null;
  const url = `${reqUrl}&audience=${encodeURIComponent(audience)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${reqToken}` } });
  if (!res.ok) return null;
  const body = (await res.json()) as { value?: string };
  return body.value ?? null;
}

describe.skipIf(!BASE)("actions oidc repo gate (live)", () => {
  it("rejects OIDC from this repo when only klappy/refinery is allow-listed", async () => {
    const audience = process.env.GITHUB_ACTIONS_OIDC_AUDIENCE ?? BASE!;
    const token = await fetchOidcToken(audience);
    expect(token, "GitHub did not issue an OIDC token (need id-token: write)").toBeTruthy();

    const res = await fetch(`${BASE}/v1/changes`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(403);
    const body = (await res.json()) as { error?: string };
    expect(body.error).toBe("oidc_not_accepted");
  });

  it("returns 401 without Authorization on /v1/changes", async () => {
    const res = await fetch(`${BASE}/v1/changes`);
    expect(res.status).toBe(401);
  });
});
