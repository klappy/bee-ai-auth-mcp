import { describe, it, expect } from "vitest";
import { classifyPath, deriveTenantKey, statusClassOf } from "../src/telemetry";
import type { Env } from "../src/types";

const env = { GITHUB_CLIENT_SECRET: "test-secret-value" } as unknown as Env;

describe("classifyPath — coarse class, never the raw path/id", () => {
  it("maps known prefixes to a class", () => {
    expect(classifyPath("/v1/me")).toBe("me");
    expect(classifyPath("/v1/conversations")).toBe("conversations");
    expect(classifyPath("/v1/search/conversations")).toBe("search");
    expect(classifyPath("/v1/changes?cursor=x")).toBe("other");
    expect(classifyPath("")).toBe("n/a");
  });

  it("never leaks a conversation id into the class", () => {
    const cls = classifyPath("/v1/conversations/abc123secret");
    expect(cls).toBe("conversations");
    expect(cls).not.toContain("abc123secret");
  });
});

describe("statusClassOf — buckets, transport_fail on null", () => {
  it("buckets correctly", () => {
    expect(statusClassOf(200)).toBe("2xx");
    expect(statusClassOf(404)).toBe("4xx");
    expect(statusClassOf(503)).toBe("5xx");
    expect(statusClassOf(null)).toBe("transport_fail");
    expect(statusClassOf(undefined)).toBe("transport_fail");
  });
});

describe("deriveTenantKey — opaque, stable, non-reversible", () => {
  it("is deterministic for the same login", async () => {
    const a = await deriveTenantKey(env, "klappy");
    const b = await deriveTenantKey(env, "klappy");
    expect(a).toBe(b);
    expect(a.startsWith("t_")).toBe(true);
  });

  it("differs by login", async () => {
    const a = await deriveTenantKey(env, "klappy");
    const b = await deriveTenantKey(env, "someone-else");
    expect(a).not.toBe(b);
  });

  it("does not contain the login in the clear (opacity)", async () => {
    const login = "klappy";
    const key = await deriveTenantKey(env, login);
    expect(key.toLowerCase()).not.toContain(login);
  });

  it("depends on the secret (non-reversible without it)", async () => {
    const other = { GITHUB_CLIENT_SECRET: "a-different-secret" } as unknown as Env;
    const a = await deriveTenantKey(env, "klappy");
    const b = await deriveTenantKey(other, "klappy");
    expect(a).not.toBe(b);
  });
});
