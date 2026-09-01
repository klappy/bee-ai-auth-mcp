import { describe, expect, it, vi, beforeEach } from "vitest";
import { bearerOf, verifyActionsOidc } from "../src/actions-oidc";
import type { Env } from "../src/types";

const jwtVerify = vi.fn();

vi.mock("jose", () => ({
  createRemoteJWKSet: () => ({}),
  jwtVerify: (...args: unknown[]) => jwtVerify(...args),
}));

function env(overrides: Partial<Env> = {}): Env {
  return {
    GITHUB_CLIENT_ID: "id",
    GITHUB_CLIENT_SECRET: "secret",
    ALLOWED_GITHUB_LOGIN: "klappy",
    ALLOWED_ACTIONS_REPOS: "klappy/refinery",
    GITHUB_ACTIONS_OIDC_AUDIENCE: "https://bee.klappy.dev",
    BEE_BRIDGE: {} as Env["BEE_BRIDGE"],
    BEE_UPSTREAM: "host:443",
    BEE_SNI: "host",
    OAUTH_KV: {} as KVNamespace,
    OAUTH_PROVIDER: {} as Env["OAUTH_PROVIDER"],
    ...overrides,
  };
}

describe("bearerOf", () => {
  it("extracts Bearer tokens", () => {
    expect(bearerOf("Bearer eyJhbG")).toBe("eyJhbG");
    expect(bearerOf("bearer abc")).toBe("abc");
  });

  it("returns null when missing or malformed", () => {
    expect(bearerOf(null)).toBeNull();
    expect(bearerOf("Basic abc")).toBeNull();
  });
});

describe("verifyActionsOidc", () => {
  beforeEach(() => {
    jwtVerify.mockReset();
  });

  it("accepts a valid token for an allow-listed repo and login", async () => {
    jwtVerify.mockResolvedValue({
      payload: {
        repository: "klappy/refinery",
        repository_owner: "klappy",
      },
    });
    const result = await verifyActionsOidc("tok", env(), "https://bee.klappy.dev/v1/changes");
    expect(result).toEqual({ login: "klappy", repository: "klappy/refinery" });
    expect(jwtVerify).toHaveBeenCalledWith(
      "tok",
      expect.anything(),
      expect.objectContaining({
        issuer: "https://token.actions.githubusercontent.com",
        audience: "https://bee.klappy.dev",
      })
    );
  });

  it("rejects when ALLOWED_ACTIONS_REPOS is unset", async () => {
    jwtVerify.mockResolvedValue({
      payload: { repository: "klappy/refinery", repository_owner: "klappy" },
    });
    expect(await verifyActionsOidc("tok", env({ ALLOWED_ACTIONS_REPOS: "" }), "https://bee.klappy.dev")).toBeNull();
    expect(jwtVerify).not.toHaveBeenCalled();
  });

  it("rejects a non-allow-listed repository", async () => {
    jwtVerify.mockResolvedValue({
      payload: { repository: "evil/other", repository_owner: "evil" },
    });
    expect(await verifyActionsOidc("tok", env(), "https://bee.klappy.dev")).toBeNull();
  });

  it("rejects when repository_owner is not on ALLOWED_GITHUB_LOGIN", async () => {
    jwtVerify.mockResolvedValue({
      payload: { repository: "klappy/refinery", repository_owner: "stranger" },
    });
    expect(await verifyActionsOidc("tok", env(), "https://bee.klappy.dev")).toBeNull();
  });

  it("returns null when jwt verification fails", async () => {
    jwtVerify.mockRejectedValue(new Error("bad sig"));
    expect(await verifyActionsOidc("tok", env(), "https://bee.klappy.dev")).toBeNull();
  });
});
