/**
 * The Cloudflare Access door — sketch point 6 of ticket bee-relay-cf-access:
 *   1. header absent → GitHub path regression (302 to github.com, unchanged)
 *   2. bad signature → email route fails closed
 *   3. wrong AUD → email route fails closed
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

const { brokerMock } = vi.hoisted(() => ({
  brokerMock: {
    startBeeBroker: vi.fn(async () => {
      throw new Error("broker exec unavailable");
    }),
    resumeBeeBroker: vi.fn(async () => {
      throw new Error("broker exec unavailable");
    }),
    clearBeeBroker: vi.fn(async () => ({ status: "cleared" as const })),
    fetch: vi.fn(async () => new Response(JSON.stringify({ id: 1 }), { status: 200 })),
  },
}));

vi.mock("@cloudflare/containers", () => ({ getContainer: () => brokerMock }));

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

function authorizeReq(headers: Record<string, string> = {}, path = "/authorize/email"): Request {
  return new Request(`https://relay.example${path}?client_id=client-1`, { headers });
}

const ctx = {} as ExecutionContext;

beforeEach(() => {
  __resetJwksCacheForTests();
  stubCerts();
  brokerMock.startBeeBroker.mockReset();
  brokerMock.resumeBeeBroker.mockReset();
  brokerMock.clearBeeBroker.mockReset();
  brokerMock.fetch.mockReset();
  brokerMock.startBeeBroker.mockImplementation(async () => {
    throw new Error("broker exec unavailable");
  });
  brokerMock.resumeBeeBroker.mockImplementation(async () => {
    throw new Error("broker exec unavailable");
  });
  brokerMock.clearBeeBroker.mockResolvedValue({ status: "cleared" });
  brokerMock.fetch.mockResolvedValue(new Response(JSON.stringify({ id: 1 }), { status: 200 }));
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
  it("offers both routes with the original escaped OAuth query when Access is configured", async () => {
    const res = await BeeAuthHandler.fetch(new Request('https://relay.example/authorize?client_id=client-1&state=a%26b&code_challenge=pkce'), envWith(), ctx);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('/authorize/email?client_id=client-1&amp;state=a%26b&amp;code_challenge=pkce');
    expect(body).toContain('/authorize/github?client_id=client-1&amp;state=a%26b&amp;code_challenge=pkce');
  });

  it("direct GitHub stays reachable when Access is configured and no assertion exists", async () => {
    const res = await BeeAuthHandler.fetch(authorizeReq({}, "/authorize/github"), envWith(), ctx);
    expect(res.status).toBe(302);
    expect(new URL(res.headers.get("location")!).hostname).toBe("github.com");
  });

  it("missing proof cannot enter the email route", async () => {
    const res = await BeeAuthHandler.fetch(authorizeReq(), envWith(), ctx);
    expect(res.status).toBe(403);
    expect(res.headers.get("location")).toBeNull();
  });

  it.each(["/authorize", "/authorize/email", "/authorize/github"])("rejects unknown OAuth clients on %s", async (path) => {
    const env = envWith();
    env.OAUTH_PROVIDER.lookupClient = async () => null;
    const res = await BeeAuthHandler.fetch(authorizeReq({}, path), env, ctx);
    expect(res.status).toBe(400);
    expect(await res.text()).toContain("Unknown client");
  });
  it("header absent: GitHub path regression — 302 to github.com, exactly as before", async () => {
    const res = await BeeAuthHandler.fetch(authorizeReq({}, "/authorize"), envWith({ ACCESS_TEAM_DOMAIN: "", ACCESS_AUD: "" }), ctx);
    expect(res.status).toBe(302);
    const loc = res.headers.get("location") ?? "";
    expect(loc.startsWith("https://github.com/login/oauth/authorize")).toBe(true);
    expect(new URL(loc).searchParams.get("client_id")).toBe("gh-client-id");
  });

  it("bad signature: email route fails closed", async () => {
    const token = await mintAccessJwt({ email: "wife@example.com", key: imposterKeys.privateKey });
    const res = await BeeAuthHandler.fetch(authorizeReq({ [ACCESS_JWT_HEADER]: token }), envWith(), ctx);
    expect(res.status).toBe(403);
    expect(res.headers.get("location")).toBeNull();
  });

  it("wrong AUD: email route fails closed", async () => {
    const token = await mintAccessJwt({ email: "wife@example.com", aud: "some-other-app" });
    const res = await BeeAuthHandler.fetch(authorizeReq({ [ACCESS_JWT_HEADER]: token }), envWith(), ctx);
    expect(res.status).toBe(403);
    expect(res.headers.get("location")).toBeNull();
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
  it.each(["/consent", "/pairing/start", "/pairing/status"])("rejects unsigned shared state on %s without requiring Access", async (path) => {
    const form = new FormData();
    form.set("s", "tampered");
    const request = path === "/consent"
      ? new Request(`https://relay.example${path}`, { method: "POST", body: form })
      : new Request(`https://relay.example${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ s: "tampered" }) });
    const res = await BeeAuthHandler.fetch(request, envWith(), ctx);
    expect(res.status).toBe(400);
    expect(res.headers.get("location")).toBeNull();
  });
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

  it("empty ALLOWED_EMAILS denies every email identity at consent", async () => {
    const signed = await signConsent(
      { req: { clientId: "client-1", scope: [], state: "s" }, login: "wife@example.com" },
      CONSENT_SECRET
    );
    const form = new FormData();
    form.set("s", signed);
    form.set("bee_token", "irrelevant");
    const res = await BeeAuthHandler.fetch(
      new Request("https://relay.example/consent", { method: "POST", body: form }),
      envWith({ ALLOWED_EMAILS: "" }),
      ctx
    );
    expect(res.status).toBe(403);
  });
});

describe("consent/pairing identity rechecks do not require Access", () => {
  it.each(["/pairing/start", "/pairing/status"])("%s denies an off-list email without an Access JWT", async (path) => {
    const signed = await signConsent(
      { req: { clientId: "client-1", scope: [], state: "s" }, login: "stranger@example.com" },
      CONSENT_SECRET
    );
    const res = await BeeAuthHandler.fetch(
      new Request(`https://relay.example${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ s: signed, p: "unused" }),
      }),
      envWith(),
      ctx
    );
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ status: "error", message: "Not authorized." });
  });

  it("/pairing/start accepts an on-list GitHub identity and only then reaches the pairing service", async () => {
    const signed = await signConsent(
      { req: { clientId: "client-1", scope: [], state: "s" }, login: "klappy" },
      CONSENT_SECRET
    );
    const res = await BeeAuthHandler.fetch(
      new Request("https://relay.example/pairing/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ s: signed }),
      }),
      envWith(),
      ctx
    );
    // Identity passed. Default broker mock throws — not an Access or allow-list deny.
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ status: "error", message: "hosted Bee CLI broker unreachable" });
  });

  it("/pairing/start accepts an on-list email identity the same way", async () => {
    const signed = await signConsent(
      { req: { clientId: "client-1", scope: [], state: "s" }, login: "wife@example.com" },
      CONSENT_SECRET
    );
    const res = await BeeAuthHandler.fetch(
      new Request("https://relay.example/pairing/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ s: signed }),
      }),
      envWith(),
      ctx
    );
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ status: "error", message: "hosted Bee CLI broker unreachable" });
  });

  it("two approved identities receive distinct hosted-CLI broker attempts", async () => {
    const seen: string[] = [];
    brokerMock.startBeeBroker.mockImplementation(async (id: string) => {
      seen.push(id);
      return { status: "pending", connectUrl: `https://bee.computer/connect#${id}` };
    });
    for (const login of ["klappy", "wife@example.com"] as const) {
      const signed = await signConsent(
        { req: { clientId: "client-1", scope: [], state: "s" }, login },
        CONSENT_SECRET
      );
      const res = await BeeAuthHandler.fetch(
        new Request("https://relay.example/pairing/start", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ s: signed }),
        }),
        envWith(),
        ctx
      );
      expect(res.status).toBe(200);
      const body = (await res.json()) as { connectUrl: string; p: string };
      expect(body.connectUrl.startsWith("https://bee.computer/connect#")).toBe(true);
      expect(body.p.length).toBeGreaterThan(20);
    }
    expect(seen).toHaveLength(2);
    expect(seen[0]).not.toBe(seen[1]);
    expect(seen[0]).toMatch(/^[a-f0-9]{32}$/);
  });

  it("completes pairing with the invitee's broker token, never an env/shared bearer", async () => {
    const { sealBrokerState } = await import("../src/broker");
    const brokerId = "cccccccccccccccccccccccccccccccc";
    const sealed = await sealBrokerState(
      { kind: "cli-broker-v1", brokerId, login: "wife@example.com", clientId: "client-1", iat: Date.now() },
      CONSENT_SECRET
    );
    brokerMock.resumeBeeBroker.mockResolvedValue({ status: "completed", token: "invitee-bee-token" });
    brokerMock.fetch.mockImplementation(async (_url: string, init?: RequestInit) => {
      const auth = new Headers(init?.headers).get("authorization");
      expect(auth).toBe("Bearer invitee-bee-token");
      expect(auth).not.toContain("klappy");
      return new Response(JSON.stringify({ id: 99, first_name: "Ada" }), { status: 200 });
    });
    const signed = await signConsent(
      { req: { clientId: "client-1", scope: [], state: "s" }, login: "wife@example.com" },
      CONSENT_SECRET
    );
    const captured: { props?: { login: string; beeToken: string } } = {};
    const env = envWith({
      OAUTH_PROVIDER: {
        parseAuthRequest: async () => ({ clientId: "client-1", scope: [], state: "s" }),
        lookupClient: async () => ({ clientId: "client-1" }),
        completeAuthorization: async (args: { props: { login: string; beeToken: string } }) => {
          captured.props = args.props;
          return { redirectTo: "https://client.example/done" };
        },
      },
    });
    const res = await BeeAuthHandler.fetch(
      new Request("https://relay.example/pairing/status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ s: signed, p: sealed }),
      }),
      env,
      ctx
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "completed", redirectTo: "https://client.example/done" });
    expect(captured.props).toEqual({ login: "wife@example.com", beeToken: "invitee-bee-token" });
    expect(brokerMock.clearBeeBroker).toHaveBeenCalledWith(brokerId);
  });

  it("an invitee cannot finish pairing with another identity's sealed broker state", async () => {
    const { sealBrokerState } = await import("../src/broker");
    const sealedForWife = await sealBrokerState(
      {
        kind: "cli-broker-v1",
        brokerId: "dddddddddddddddddddddddddddddddd",
        login: "wife@example.com",
        clientId: "client-1",
        iat: Date.now(),
      },
      CONSENT_SECRET
    );
    brokerMock.resumeBeeBroker.mockResolvedValue({ status: "completed", token: "should-not-be-used" });
    const signedKlappy = await signConsent(
      { req: { clientId: "client-1", scope: [], state: "s" }, login: "klappy" },
      CONSENT_SECRET
    );
    const res = await BeeAuthHandler.fetch(
      new Request("https://relay.example/pairing/status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ s: signedKlappy, p: sealedForWife }),
      }),
      envWith(),
      ctx
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      status: "error",
      message: "Pairing state invalid or stale — get a new code.",
    });
    expect(brokerMock.resumeBeeBroker).not.toHaveBeenCalled();
    expect(brokerMock.clearBeeBroker).not.toHaveBeenCalled();
  });

  it("retry start clears only that identity's previous broker dir", async () => {
    const { sealBrokerState } = await import("../src/broker");
    const previousId = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
    const sealed = await sealBrokerState(
      { kind: "cli-broker-v1", brokerId: previousId, login: "wife@example.com", clientId: "client-1", iat: Date.now() },
      CONSENT_SECRET
    );
    brokerMock.startBeeBroker.mockResolvedValue({
      status: "pending",
      connectUrl: "https://bee.computer/connect#retry",
    });
    const signed = await signConsent(
      { req: { clientId: "client-1", scope: [], state: "s" }, login: "wife@example.com" },
      CONSENT_SECRET
    );
    const res = await BeeAuthHandler.fetch(
      new Request("https://relay.example/pairing/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ s: signed, p: sealed }),
      }),
      envWith(),
      ctx
    );
    expect(res.status).toBe(200);
    expect(brokerMock.clearBeeBroker).toHaveBeenCalledWith(previousId);
    expect(brokerMock.startBeeBroker).toHaveBeenCalledTimes(1);
    expect(brokerMock.startBeeBroker.mock.calls[0][0]).not.toBe(previousId);
  });

  it("retry start with another identity's sealed blob does not clear that dir", async () => {
    const { sealBrokerState } = await import("../src/broker");
    const wifeId = "ffffffffffffffffffffffffffffffff";
    const sealedForWife = await sealBrokerState(
      { kind: "cli-broker-v1", brokerId: wifeId, login: "wife@example.com", clientId: "client-1", iat: Date.now() },
      CONSENT_SECRET
    );
    brokerMock.startBeeBroker.mockResolvedValue({
      status: "pending",
      connectUrl: "https://bee.computer/connect#klappy",
    });
    const signedKlappy = await signConsent(
      { req: { clientId: "client-1", scope: [], state: "s" }, login: "klappy" },
      CONSENT_SECRET
    );
    const res = await BeeAuthHandler.fetch(
      new Request("https://relay.example/pairing/start", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ s: signedKlappy, p: sealedForWife }),
      }),
      envWith(),
      ctx
    );
    expect(res.status).toBe(200);
    expect(brokerMock.clearBeeBroker).not.toHaveBeenCalled();
  });

  it("expired resume clears the owned broker dir", async () => {
    const { sealBrokerState } = await import("../src/broker");
    const brokerId = "12121212121212121212121212121212";
    const sealed = await sealBrokerState(
      { kind: "cli-broker-v1", brokerId, login: "wife@example.com", clientId: "client-1", iat: Date.now() },
      CONSENT_SECRET
    );
    brokerMock.resumeBeeBroker.mockResolvedValue({ status: "expired" });
    const signed = await signConsent(
      { req: { clientId: "client-1", scope: [], state: "s" }, login: "wife@example.com" },
      CONSENT_SECRET
    );
    const res = await BeeAuthHandler.fetch(
      new Request("https://relay.example/pairing/status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ s: signed, p: sealed }),
      }),
      envWith(),
      ctx
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "expired" });
    expect(brokerMock.clearBeeBroker).toHaveBeenCalledWith(brokerId);
  });
});

describe("non-browser MCP endpoints do not depend on Access", () => {
  it.each(["/register", "/token", "/mcp"])("BeeAuthHandler does not intercept %s or require an Access JWT", async (path) => {
    const res = await BeeAuthHandler.fetch(
      new Request(`https://relay.example${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      }),
      envWith(),
      ctx
    );
    expect(res.status).toBe(404);
    expect(await res.text()).toBe("Not found");
  });
});
