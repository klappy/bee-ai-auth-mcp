import { describe, expect, it } from "vitest";
import { bindActionsGrant, resolveActionsGrant } from "../src/actions-grant";

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
