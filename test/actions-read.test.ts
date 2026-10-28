import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@cloudflare/containers", () => ({ getContainer: () => ({}) }));

const mocks = vi.hoisted(() => ({ verify: vi.fn(), grant: vi.fn(), read: vi.fn() }));
vi.mock("../src/actions-oidc", async (original) => ({ ...await original<typeof import("../src/actions-oidc")>(), verifyActionsOidc: mocks.verify }));
vi.mock("../src/actions-grant", () => ({ resolveActionsGrant: mocks.grant }));
vi.mock("../src/bee", () => ({ beeRead: mocks.read }));
const { isActionsReadPath, handleActionsRead } = await import("../src/actions-read");

describe("isActionsReadPath", () => {
  it("allows /v1/changes", () => {
    expect(isActionsReadPath("/v1/changes")).toBe(true);
  });

  it("allows /v1/conversations/:id", () => {
    expect(isActionsReadPath("/v1/conversations/10189141")).toBe(true);
  });

  it("rejects list and nested conversation paths", () => {
    expect(isActionsReadPath("/v1/conversations")).toBe(false);
    expect(isActionsReadPath("/v1/conversations/1/related")).toBe(false);
  });

  it("rejects other Bee paths", () => {
    expect(isActionsReadPath("/v1/me")).toBe(false);
    expect(isActionsReadPath("/mcp")).toBe(false);
  });
});


describe("handleActionsRead boundary", () => {
  const env = { OAUTH_KV: {}, ALLOWED_GITHUB_LOGIN: "klappy", GITHUB_CLIENT_SECRET: "synthetic", BEE_BRIDGE: {} } as unknown as import("../src/types").Env;
  const request = (method = "GET", auth = true) => new Request("https://bee.invalid/v1/changes", {
    method, headers: auth ? { Authorization: "Bearer synthetic" } : {},
  });
  beforeEach(() => { vi.clearAllMocks(); mocks.verify.mockResolvedValue({ login: "klappy", repository: "klappy/refinery" }); });
  it("denies missing authentication before touching the grant", async () => {
    expect((await handleActionsRead(request("GET", false), env)).status).toBe(401);
    expect(mocks.grant).not.toHaveBeenCalled();
  });
  it("denies invalid identity before touching the grant", async () => {
    mocks.verify.mockResolvedValue(null);
    expect((await handleActionsRead(request(), env)).status).toBe(403);
    expect(mocks.grant).not.toHaveBeenCalled();
  });
  it("reports missing captured sidecar without contacting Bee", async () => {
    mocks.grant.mockResolvedValue(null);
    const result = await handleActionsRead(request(), env);
    expect(result.status).toBe(403);
    expect(await result.json()).toEqual({ error: "no_captured_grant" });
    expect(mocks.read).not.toHaveBeenCalled();
  });
  it("retains the staging denial for GitHub identities", async () => {
    expect((await handleActionsRead(request(), { ...env, BEE_ENVIRONMENT: "staging" })).status).toBe(403);
    expect(mocks.grant).not.toHaveBeenCalled();
    expect(mocks.read).not.toHaveBeenCalled();
  });
  it("rejects writes before authentication or grant access", async () => {
    expect((await handleActionsRead(request("POST"), env)).status).toBe(405);
    expect(mocks.verify).not.toHaveBeenCalled();
    expect(mocks.grant).not.toHaveBeenCalled();
  });
});
