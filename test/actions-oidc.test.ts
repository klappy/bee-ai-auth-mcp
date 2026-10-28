import { describe, expect, it, vi, beforeAll, beforeEach } from "vitest";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import type { Env } from "../src/types";

// Keep real signature/issuer/audience/expiry verification; replace only the network JWKS.
const local = vi.hoisted(() => ({ keys: undefined as unknown }));
vi.mock("jose", async (importOriginal) => {
  const actual = await importOriginal<typeof import("jose")>();
  return { ...actual, createRemoteJWKSet: () => (...args: unknown[]) =>
    (local.keys as (...args: unknown[]) => unknown)(...args) };
});
const { bearerOf, verifyActionsOidc } = await import("../src/actions-oidc");

const claims = {
  sub: "repo:klappy/refinery:ref:refs/heads/main",
  repository: "klappy/refinery",
  repository_owner: "klappy",
  ref: "refs/heads/main",
  event_name: "schedule",
};
function env(overrides: Partial<Env> = {}): Env {
  return { ALLOWED_GITHUB_LOGIN: "klappy", ALLOWED_ACTIONS_REPOS: "klappy/refinery",
    GITHUB_ACTIONS_OIDC_AUDIENCE: "https://bee.klappy.dev", ...overrides } as Env;
}
let privateKey: CryptoKey;
beforeAll(async () => {
  const pair = await generateKeyPair("RS256");
  privateKey = pair.privateKey;
  local.keys = createLocalJWKSet({ keys: [{ ...await exportJWK(pair.publicKey), kid: "test", alg: "RS256" }] });
});
beforeEach(() => { vi.restoreAllMocks(); vi.spyOn(console, "warn").mockImplementation(() => {}); });
async function token(overrides: Record<string, unknown> = {}) {
  return new SignJWT({ ...claims, ...overrides }).setProtectedHeader({ alg: "RS256", kid: "test" })
    .setIssuer("https://token.actions.githubusercontent.com").setAudience("https://bee.klappy.dev")
    .setExpirationTime("5m").sign(privateKey);
}
const verify = (jwt: string, settings = env()) => verifyActionsOidc(jwt, settings, "https://bee.klappy.dev/v1/changes");

describe("bearerOf", () => {
  it("extracts only a single Bearer credential", () => {
    expect(bearerOf("Bearer synthetic")).toBe("synthetic");
    for (const value of [null, "Basic synthetic", "Bearer a b"]) expect(bearerOf(value)).toBeNull();
  });
});
describe("verifyActionsOidc", () => {
  it("accepts a signed main token for the exact seat", async () => {
    expect(await verify(await token())).toEqual({ login: "klappy", repository: "klappy/refinery" });
  });
  it.each([
    ["wrong repo", { repository: "klappy/other" }],
    ["wrong ref", { ref: "refs/heads/feature" }],
    ["wrong subject ref", { sub: "repo:klappy/refinery:ref:refs/heads/feature" }],
    ["PR subject", { sub: "repo:klappy/refinery:pull_request", ref: "refs/pull/1/merge" }],
    ["PR event with conflicting main claims", { event_name: "pull_request" }],
    ["PR target context", { event_name: "pull_request_target" }],
    ["environment subject", { sub: "repo:klappy/refinery:environment:production" }],
    ["wrong owner", { repository_owner: "stranger" }],
    ["missing ref", { ref: undefined }],
    ["missing repository", { repository: undefined }],
    ["missing subject", { sub: undefined }],
  ])("rejects %s", async (_name, changed) => {
    expect(await verify(await token(changed))).toBeNull();
  });
  it("rejects wrong audience, issuer, expired, missing expiry, and invalid signature", async () => {
    for (const jwt of [
      await new SignJWT(claims).setProtectedHeader({ alg: "RS256", kid: "test" }).setIssuer("https://token.actions.githubusercontent.com").setAudience("wrong").setExpirationTime("5m").sign(privateKey),
      await new SignJWT(claims).setProtectedHeader({ alg: "RS256", kid: "test" }).setIssuer("wrong").setAudience("https://bee.klappy.dev").setExpirationTime("5m").sign(privateKey),
      await new SignJWT(claims).setProtectedHeader({ alg: "RS256", kid: "test" }).setIssuer("https://token.actions.githubusercontent.com").setAudience("https://bee.klappy.dev").setExpirationTime(1).sign(privateKey),
      await new SignJWT(claims).setProtectedHeader({ alg: "RS256", kid: "test" }).setIssuer("https://token.actions.githubusercontent.com").setAudience("https://bee.klappy.dev").sign(privateKey),
      "invalid.synthetic.jwt",
    ]) expect(await verify(jwt)).toBeNull();
  });
  it("fails closed when either allow-list is empty; extra repos do not expand the seat", async () => {
    expect(await verify(await token(), env({ ALLOWED_ACTIONS_REPOS: "" }))).toBeNull();
    expect(await verify(await token(), env({ ALLOWED_GITHUB_LOGIN: "" }))).toBeNull();
    expect(await verify(await token({ repository: "klappy/other", sub: "repo:klappy/other:ref:refs/heads/main" }), env({ ALLOWED_ACTIONS_REPOS: "klappy/refinery,klappy/other" }))).toBeNull();
  });
  it("logs the verified denied subject without logging the JWT", async () => {
    const jwt = await token({ ref: "refs/heads/feature" });
    await verify(jwt);
    expect(console.warn).toHaveBeenCalledWith(JSON.stringify({ event: "actions_oidc_denied", sub: claims.sub }));
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain(jwt);
  });
});
