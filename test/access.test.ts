/**
 * The Cloudflare Access door — sketch point 6 of ticket bee-relay-cf-access:
 *   1. header absent → GitHub path regression (302 to github.com, unchanged)
 *   2. bad signature → falls through to the GitHub redirect
 *   3. wrong AUD → falls through to the GitHub redirect
 *   4. email off-list → 403 deny BEFORE any consent screen renders
 *   5. email on-list → reaches the consent form as that email
 *   6. existing GitHub grants untouched → /consent still honors a
 *      GitHub-login consent state; the two namespaces stay disjoint.
 *
 * JWTs are minted locally with jose; the team's certs endpoint is served by a
 * stubbed global fetch (createRemoteJWKSet fetches through it), so signature
 * verification is REAL — only the network is fake.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SignJWT, exportJWK, generateKeyPair } from "jose";

vi.mock("@cloudflare/containers", () => ({ getContainer: () => ({}) }));

const { verifyAccessJwt, __resetJwksCacheForTests, ACCESS_JWT_HEADER } = await import("../src/access");
const { BeeAuthHandler, isAllowedEmail } = await import("../src/bee-auth");
const { signConsent } = await import("../src/state");

const TEAM = "testteam.cloudflareaccess.com";
const AUD = "aud-tag-under-test";
const CONSENT_SECRET = "consent-signing-secret-under-test";

// One RS256 pair for the whole file: "the team's key" published at the certs
// endpoint. A second pair signs the imposter token for the bad-signature case.
const teamKeys = await generateKeyPair("RS256");
const imposterKeys = await generateKeyPair("RS256");
const teamJwk = { ...(await exportJWK(teamKeys.publicKey)), kid: "team-key-1", alg: "RS256", use: "sig" };

function stubCerts(): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const u = String(input instanceof Request ? input.url : input);
      if (u === `https://${TEAM}/cdn-cgi/access/certs`) {
        return new Response(JSON.stringify({ keys: [teamJwk] }), {
          headers: { "content-type": "application/json" },
        });
      }
      throw new Error(`unexpected fetch in test: ${u}`);
    })
  );
}

async function mintAccessJwt(opts: {
  email?: string;
  aud?: string;
  iss?: string;
  key?: CryptoKey;
}): Promise<string> {
  const jwt = new SignJWT(opts.email === undefined ? {} : { email: opts.email })
    .setProtectedHeader({ alg: "RS256", kid: "team-key-1" })
    .setIssuer(opts.iss ?? `https://${TEAM}`)
    .setAudience(opts.aud ?? AUD)
    .setIssuedAt()
    .setExpirationTime("5m");
  return jwt.sign(opts.key ?? teamKeys.privateKey);
}

/** Minimal Env for the routes under test. The OAUTH_PROVIDER stub parses any
 *  /authorize request as a valid known-client AuthRequest. */
function envWith(overrides: Record<string, unknown> = {}): any {
  return {
    GITHUB_CLIENT_ID: "gh-client-id",
    GITHUB_CLIENT_SECRET: "gh-client-secret",
    CONSENT_SIGNING_SECRET: CONSENT_SECRET,
    ALLOWED_GITHUB_LOGIN: "klappy,tatacurly",
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    ALLOWED_EMAILS: "wife@example.com",
    OAUTH_PROVIDER: {
      parseAuthRequest: async () => ({ clientId: "client-1", scope: [], state: "s" }),
      lookupClient: async () => ({ clientId: "client-1" }),
      completeAuthorization: async () => ({ redirectTo: "https://client.example/done" }),
    },
    ...overrides,
  };
}

function authorizeReq(headers: Record<string, string> = {}): Request {
  return new Request("https://relay.example/authorize?client_id=client-1", { headers });
}

const ctx = {} as ExecutionContext;

beforeEach(() => {
  __resetJwksCacheForTests();
  stubCerts();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe("verifyAccessJwt", () => {
  it("accepts a well-signed token with pinned iss + aud and returns the email", async () => {
    const token = await mintAccessJwt({ email: "wife@example.com" });
    const out = await verifyAccessJwt(authorizeReq({ [ACCESS_JWT_HEADER]: token }), envWith());
    expect(out).toEqual({ email: "wife@example.com" });
  });

  it("returns null when the door is unconfigured, even with a valid token", async () => {
    const token = await mintAccessJwt({ email: "wife@example.com" });
    const env = envWith({ ACCESS_TEAM_DOMAIN: "", ACCESS_AUD: "" });
    expect(await verifyAccessJwt(authorizeReq({ [ACCESS_JWT_HEADER]: token }), env)).toBeNull();
  });

  it("returns null on a token signed by the wrong key", async () => {
    const token = await mintAccessJwt({ email: "wife@example.com", key: imposterKeys.privateKey });
    expect(await verifyAccessJwt(authorizeReq({ [ACCESS_JWT_HEADER]: token }), envWith())).toBeNull();
  });

  it("returns null on a wrong audience", async () => {
    const token = await mintAccessJwt({ email: "wife@example.com", aud: "some-other-app" });
    expect(await verifyAccessJwt(authorizeReq({ [ACCESS_JWT_HEADER]: token }), envWith())).toBeNull();
  });

  it("returns null on a wrong issuer", async () => {
    const token = await mintAccessJwt({ email: "wife@example.com", iss: "https://evil.example" });
    expect(await verifyAccessJwt(authorizeReq({ [ACCESS_JWT_HEADER]: token }), envWith())).toBeNull();
  });

  it("returns null when the token carries no email claim", async () => {
    const token = await mintAccessJwt({});
    expect(await verifyAccessJwt(authorizeReq({ [ACCESS_JWT_HEADER]: token }), envWith())).toBeNull();
  });
});

describe("/authorize — the two doors", () => {
  it("header absent: GitHub path regression — 302 to github.com, exactly as before", async () => {
    const res = await BeeAuthHandler.fetch(authorizeReq(), envWith(), ctx);
    expect(res.status).toBe(302);
    const loc = res.headers.get("location") ?? "";
    expect(loc.startsWith("https://github.com/login/oauth/authorize")).toBe(true);
    expect(new URL(loc).searchParams.get("client_id")).toBe("gh-client-id");
  });

  it("bad signature: falls through to the GitHub redirect (no error page, no consent)", async () => {
    const token = await mintAccessJwt({ email: "wife@example.com", key: imposterKeys.privateKey });
    const res = await BeeAuthHandler.fetch(authorizeReq({ [ACCESS_JWT_HEADER]: token }), envWith(), ctx);
    expect(res.status).toBe(302);
    expect(res.headers.get("location") ?? "").toContain("github.com/login/oauth/authorize");
  });

  it("wrong AUD: falls through to the GitHub redirect", async () => {
    const token = await mintAccessJwt({ email: "wife@example.com", aud: "some-other-app" });
    const res = await BeeAuthHandler.fetch(authorizeReq({ [ACCESS_JWT_HEADER]: token }), envWith(), ctx);
    expect(res.status).toBe(302);
    expect(res.headers.get("location") ?? "").toContain("github.com/login/oauth/authorize");
  });

  it("valid JWT, email off-list: 403 deny BEFORE any consent screen renders", async () => {
    const token = await mintAccessJwt({ email: "stranger@example.com" });
    const res = await BeeAuthHandler.fetch(authorizeReq({ [ACCESS_JWT_HEADER]: token }), envWith(), ctx);
    expect(res.status).toBe(403);
    const body = await res.text();
    expect(body).toContain("Not authorized");
    expect(body).not.toContain("Connect your Bee"); // the consent form never rendered
  });

  it("valid JWT, email on-list: reaches the consent form as that email, GitHub leg skipped", async () => {
    const token = await mintAccessJwt({ email: "wife@example.com" });
    const res = await BeeAuthHandler.fetch(authorizeReq({ [ACCESS_JWT_HEADER]: token }), envWith(), ctx);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain("Connect your Bee");
    expect(body).toContain("wife@example.com");
    expect(res.headers.get("location")).toBeNull(); // no GitHub bounce happened
  });
});

describe("existing GitHub grants and namespaces stay untouched", () => {
  it("/consent still honors a GitHub-login consent state (dual-namespace re-check)", async () => {
    // A consent state exactly as /callback would sign it for a GitHub login.
    const signed = await signConsent(
      { req: { clientId: "client-1", scope: [], state: "s" }, login: "klappy" },
      CONSENT_SECRET
    );
    const form = new FormData();
    form.set("s", signed);
    form.set("bee_token", ""); // empty token: passes the identity gate, re-renders consent
    const res = await BeeAuthHandler.fetch(
      new Request("https://relay.example/consent", { method: "POST", body: form }),
      envWith(),
      ctx
    );
    // Not a 403: the GitHub-login namespace still authorizes through isAllowed.
    expect(res.status).toBe(400);
    const body = await res.text();
    expect(body).toContain("Connect your Bee");
    expect(body).toContain("Please paste your Bee API token.");
  });

  it("/consent applies the email list to an email identity the same way", async () => {
    const signed = await signConsent(
      { req: { clientId: "client-1", scope: [], state: "s" }, login: "stranger@example.com" },
      CONSENT_SECRET
    );
    const form = new FormData();
    form.set("s", signed);
    form.set("bee_token", "irrelevant");
    const res = await BeeAuthHandler.fetch(
      new Request("https://relay.example/consent", { method: "POST", body: form }),
      envWith(),
      ctx
    );
    expect(res.status).toBe(403); // off the email list — denied at the same gate
  });

  it("the namespaces are disjoint: an email never matches the GitHub list and vice versa", () => {
    const env = envWith({ ALLOWED_GITHUB_LOGIN: "klappy", ALLOWED_EMAILS: "wife@example.com" });
    expect(isAllowedEmail("wife@example.com", env)).toBe(true);
    expect(isAllowedEmail("klappy", env)).toBe(false); // a login is not an email
  });
});
