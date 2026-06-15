import { describe, it, expect } from "vitest";
import { encodeState, decodeState } from "../src/state";

describe("state round-trip", () => {
  it("encodes and decodes an object losslessly", () => {
    const obj = {
      responseType: "code",
      clientId: "abc-123",
      redirectUri: "https://x/cb",
      scope: ["bee_read"],
      state: "s≈π",
    };
    expect(decodeState(encodeState(obj))).toEqual(obj);
  });
  it("is url-safe (no + / =)", () => {
    const s = encodeState({ a: "?".repeat(100) });
    expect(/[+/=]/.test(s)).toBe(false);
  });
  it("throws on garbage", () => {
    expect(() => decodeState("!!!not-state!!!")).toThrow();
  });
});

describe("signed consent round-trip", () => {
  const SECRET = "test-client-secret-value";
  const payload = { req: { clientId: "abc", redirectUri: "https://x/cb" }, login: "klappy" };

  it("verifies a payload it signed", async () => {
    const { signConsent, verifyConsent } = await import("../src/state");
    const blob = await signConsent(payload, SECRET);
    expect(await verifyConsent(blob, SECRET)).toEqual(payload);
  });

  it("rejects a tampered payload body", async () => {
    const { signConsent, verifyConsent } = await import("../src/state");
    const blob = await signConsent(payload, SECRET);
    const [body, sig] = blob.split(".");
    // Flip the login by re-encoding a different body but keeping the old sig.
    const forgedBody = btoa(JSON.stringify({ ...payload, login: "attacker" }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(await verifyConsent(`${forgedBody}.${sig}`, SECRET)).toBeNull();
    // sanity: original still verifies
    expect(await verifyConsent(`${body}.${sig}`, SECRET)).toEqual(payload);
  });

  it("rejects a wrong signing key", async () => {
    const { signConsent, verifyConsent } = await import("../src/state");
    const blob = await signConsent(payload, SECRET);
    expect(await verifyConsent(blob, "different-secret")).toBeNull();
  });

  it("rejects malformed blobs", async () => {
    const { verifyConsent } = await import("../src/state");
    expect(await verifyConsent("no-dot-here", SECRET)).toBeNull();
    expect(await verifyConsent(".onlysig", SECRET)).toBeNull();
    expect(await verifyConsent("onlybody.", SECRET)).toBeNull();
  });
});
