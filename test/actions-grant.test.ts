import { describe, expect, it } from "vitest";
import { bindOperatorActionsGrant, bindActionsGrant, resolveActionsGrant } from "../src/actions-grant";

const SECRET = "test-github-client-secret";

function mockKv(): KVNamespace {
  const store = new Map<string, string>();
  return {
    get: async (key: string) => store.get(key) ?? null,
    put: async (key: string, value: string) => {
      store.set(key, value);
    },
    delete: async (key: string) => {
      store.delete(key);
    },
    list: async () => ({ keys: [], list_complete: true }),
    getWithMetadata: async () => null,
  } as KVNamespace;
}

describe("actions-grant", () => {
  it("round-trips a sealed Bee bearer for a login", async () => {
    const kv = mockKv();
    await bindActionsGrant(kv, "Klappy", "bee-secret-token", SECRET);
    const resolved = await resolveActionsGrant(kv, "klappy", SECRET);
    expect(resolved).toBe("bee-secret-token");
  });

  it("returns null when no sidecar exists", async () => {
    const kv = mockKv();
    expect(await resolveActionsGrant(kv, "klappy", SECRET)).toBeNull();
  });

  it("returns null on tampered blob", async () => {
    const kv = mockKv();
    await bindActionsGrant(kv, "klappy", "bee-secret-token", SECRET);
    await kv.put("actions-grant:klappy", "not-a-valid-blob");
    expect(await resolveActionsGrant(kv, "klappy", SECRET)).toBeNull();
  });
});


describe("operator sidecar custody", () => {
  it("captures only the enabled production operator, never email/staging/other identities", async () => {
    const kv = mockKv();
    const env = { OAUTH_KV: kv, GITHUB_CLIENT_SECRET: SECRET, ALLOWED_ACTIONS_REPOS: "klappy/refinery", ALLOWED_GITHUB_LOGIN: "klappy,other" } as import("../src/types").Env;
    for (const [login, changes] of [["other", {}], ["synthetic@example.invalid", {}], ["klappy", { BEE_ENVIRONMENT: "staging" }], ["klappy", { ALLOWED_ACTIONS_REPOS: "" }]] as const) {
      await bindOperatorActionsGrant({ ...env, ...changes }, login, "synthetic");
      expect(await resolveActionsGrant(kv, login, SECRET)).toBeNull();
    }
    await bindOperatorActionsGrant({ ...env, BEE_ENVIRONMENT: "production" }, "klappy", "synthetic");
    expect(await resolveActionsGrant(kv, "klappy", SECRET)).toBe("synthetic");
  });
});
