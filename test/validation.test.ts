import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ fetch: vi.fn(), reserve: vi.fn() }));
vi.mock("../src/index", () => ({ default: { fetch: mocks.fetch } }));
vi.mock("@cloudflare/containers", () => ({
  Container: class {}, getContainer: () => ({ reserveValidationRequest: mocks.reserve }),
}));
import entry, { BeeBridge } from "../src/validation";
import { validationExpiry, VALIDATION_REQUEST_LIMIT } from "../src/validation-window";

const start = "2026-09-09T05:00:00.000Z";
const end = "2026-09-09T07:00:00.000Z";
const env = { VALIDATION_STARTS_AT: start, VALIDATION_EXPIRES_AT: end, CONSENT_SIGNING_SECRET: "synthetic-test-only" };
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(Date.parse(start)); vi.clearAllMocks(); });

describe("validation window", () => {
  it("requires a canonical explicit bounded window, never resets on restart", () => {
    expect(validationExpiry({})).toBeNull();
    expect(validationExpiry({ ...env, VALIDATION_EXPIRES_AT: "invalid" })).toBeNull();
    expect(validationExpiry({ ...env, VALIDATION_EXPIRES_AT: "2026-09-09T07:00:01.000Z" })).toBeNull();
    expect(validationExpiry(env, Date.parse(start) - 1)).toBeNull();
    expect(validationExpiry(env, Date.parse(end))).toBeNull();
    expect(validationExpiry(env, Date.parse(start))).toBe(Date.parse(end));
  });
  it.each(["/", "/register", "/token", "/mcp", "/authorize/email", "/pairing/start"])("blocks %s before storage/CLI when expired", async path => {
    vi.setSystemTime(Date.parse(end));
    const response = await entry.fetch(new Request(`https://isolated.invalid${path}`), env as never, {} as never);
    expect(response.status).toBe(503);
    expect(mocks.reserve).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it("missing signing custody denies before storage or auth", async () => {
    const response = await entry.fetch(new Request("https://isolated.invalid/mcp"), { ...env, CONSENT_SIGNING_SECRET: "" } as never, {} as never);
    expect(response.status).toBe(503); expect(mocks.reserve).not.toHaveBeenCalled();
  });
  it("passes the identical request and env to real auth after quota; adds no identity shortcut", async () => {
    mocks.reserve.mockResolvedValue(true); mocks.fetch.mockResolvedValue(new Response("real auth response", { status: 401 }));
    const request = new Request("https://isolated.invalid/mcp", { headers: { Authorization: "Bearer synthetic-test" } });
    const ctx = {};
    const response = await entry.fetch(request, env as never, ctx as never);
    expect(response.status).toBe(401); expect(mocks.fetch).toHaveBeenCalledWith(request, env, ctx);
  });
  it("quota failure and storage error deny without leaking diagnostics", async () => {
    mocks.reserve.mockResolvedValue(false);
    expect((await entry.fetch(new Request("https://isolated.invalid"), env as never, {} as never)).status).toBe(503);
    mocks.reserve.mockRejectedValue(new Error("synthetic-sensitive-diagnostic"));
    const response = await entry.fetch(new Request("https://isolated.invalid"), env as never, {} as never);
    expect(await response.text()).not.toContain("sensitive"); expect(mocks.fetch).not.toHaveBeenCalled();
  });
});

function instance(state = new Map<string, unknown>()) {
  const bridge = Object.create(BeeBridge.prototype);
  const storage = { get: async (key: string) => state.get(key), put: async (key: string, value: unknown) => { state.set(key, value); } };
  let tail = Promise.resolve();
  bridge.env = env;
  bridge.ctx = { storage: { ...storage, transaction: (fn: (t: typeof storage) => Promise<boolean>) => {
    const result = tail.then(() => fn(storage)); tail = result.then(() => {}, () => {}); return result;
  } } };
  bridge.schedule = vi.fn().mockResolvedValue({ id: "synthetic" });
  bridge.destroy = vi.fn().mockResolvedValue(undefined);
  return { bridge: bridge as BeeBridge, state };
}
describe("persistent admission budget", () => {
  it("concurrent admissions do not overspend remaining quota; recreation retains count", async () => {
    const { bridge, state } = instance(new Map([["validation:requests", VALIDATION_REQUEST_LIMIT - 1]]));
    expect((await Promise.all([bridge.reserveValidationRequest(), bridge.reserveValidationRequest()])).filter(Boolean)).toHaveLength(1);
    expect(await instance(state).bridge.reserveValidationRequest()).toBe(false);
  });
  it("requires shutdown scheduling before admitting work", async () => {
    const { bridge } = instance();
    vi.mocked(bridge.schedule).mockRejectedValue(new Error("scheduler unavailable"));
    await expect(bridge.reserveValidationRequest()).rejects.toThrow("scheduler unavailable");
  });
  it("expiry marks stopped before destroy and prevents future admissions", async () => {
    const { bridge, state } = instance();
    await bridge.expireValidation();
    expect(state.get("validation:stopped")).toBe(true); expect(bridge.destroy).toHaveBeenCalledOnce();
    expect(await bridge.reserveValidationRequest()).toBe(false);
  });
});
