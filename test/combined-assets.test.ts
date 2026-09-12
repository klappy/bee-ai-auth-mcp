import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ real: vi.fn(), reserve: vi.fn() }));
vi.mock("../src/index", () => ({ default: { fetch: mocks.real } }));
vi.mock("@cloudflare/containers", () => ({ Container: class {}, getContainer: () => ({ reserveValidationRequest: mocks.reserve }) }));
import entry from "../src/validation";
const now = "2026-09-09T05:00:00.000Z";
const env = {
  VALIDATION_STARTS_AT: now, VALIDATION_EXPIRES_AT: "2026-09-09T07:00:00.000Z",
  CONSENT_SIGNING_SECRET: "synthetic-only",

};
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(Date.parse(now)); vi.clearAllMocks();
  mocks.reserve.mockResolvedValue(true); mocks.real.mockResolvedValue(new Response("Not found", { status: 404 }));

});
describe("private auth trial does not publish homepage copy", () => {
  it("keeps homepage closed even within active general validation window", async () => {
    const request = new Request("https://isolated.invalid/");
    const response = await entry.fetch(request, env as never, {} as never);
    expect(response.status).toBe(503);
    expect(mocks.real).not.toHaveBeenCalled();
    expect(mocks.reserve).not.toHaveBeenCalled();

  });
  it("expiry blocks assets before quota/storage", async () => {
    vi.setSystemTime(Date.parse(env.VALIDATION_EXPIRES_AT));
    expect((await entry.fetch(new Request("https://isolated.invalid/"), env as never, {} as never)).status).toBe(503);
    expect(mocks.reserve).not.toHaveBeenCalled();
  });
  it.each(["/mcp", "/register", "/token", "/authorize/email", "/pairing/start", "/.well-known/oauth-authorization-server"])("never turns %s errors into assets", async path => {
    const method = ["/register", "/token", "/pairing/start"].includes(path) ? "POST" : "GET";
    expect((await entry.fetch(new Request(`https://isolated.invalid${path}`, { method }), env as never, {} as never)).status).toBe(404);
   
  });
  it("does not serve asset fallbacks for POST", async () => {
    expect((await entry.fetch(new Request("https://isolated.invalid/", { method: "POST" }), env as never, {} as never)).status).toBe(503);
   
  });
  it("preserves protocol errors but never serves assets without a binding", async () => {
    mocks.real.mockResolvedValueOnce(new Response("challenge", { status: 401 }));
    expect((await entry.fetch(new Request("https://isolated.invalid/mcp"), env as never, {} as never)).status).toBe(401);
    expect((await entry.fetch(new Request("https://isolated.invalid/"), env as never, {} as never)).status).toBe(503);
  });
  it("does not publish branded malformed-auth HTML", async () => {
    mocks.real.mockResolvedValueOnce(new Response("private copy", { status: 400, headers: { "Content-Type": "text/html" } }));
    const response = await entry.fetch(new Request("https://isolated.invalid/consent", { method: "POST" }), env as never, {} as never);
    expect(response.status).toBe(503); expect(await response.text()).not.toContain("private copy");
  });
});
