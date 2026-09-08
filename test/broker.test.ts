import { describe, expect, it, vi } from "vitest";

vi.mock("@cloudflare/containers", () => ({
  Container: class {
    env = {};
    ctx = {};
  },
  getContainer: () => ({}),
}));

import { readFileSync } from "node:fs";
import {
  assertBrokerId,
  brokerClearTarget,
  brokerClearWouldTouch,
  brokerConfigDir,
  brokerExecArgv,
  extractConnectUrl,
  newBrokerId,
  parseBrokerResume,
  parseBrokerStart,
  sanitizeBrokerLine,
  sealBrokerState,
  unsealBrokerState,
} from "../src/broker";
import { bridgeContainerEnv } from "../src/bridge";

describe("opaque broker isolation", () => {
  it("mints 32-hex ids that are not emails or logins", () => {
    const a = newBrokerId();
    const b = newBrokerId();
    expect(a).toMatch(/^[a-f0-9]{32}$/);
    expect(b).toMatch(/^[a-f0-9]{32}$/);
    expect(a).not.toBe(b);
    expect(a.includes("@")).toBe(false);
    expect(assertBrokerId("wife@example.com")).toBeNull();
    expect(assertBrokerId("klappy")).toBeNull();
    expect(assertBrokerId("../etc/passwd")).toBeNull();
    expect(assertBrokerId(a)).toBe(a);
  });

  it("refuses to derive a config dir from anything except an opaque id", () => {
    expect(brokerConfigDir("wife@example.com")).toBeNull();
    expect(brokerConfigDir("../../klappy")).toBeNull();
    expect(brokerConfigDir("aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")).toBe(
      "/tmp/bee-broker/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
    );
  });

  it("clearing A cannot name B's directory", () => {
    const a = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const b = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
    expect(brokerClearTarget(a)).not.toBe(brokerClearTarget(b));
    expect(brokerClearWouldTouch(a, b)).toBe(false);
    expect(brokerClearWouldTouch(a, a)).toBe(true);
    expect(brokerClearTarget("not-an-id")).toBeNull();
  });
});

describe("broker helper wire", () => {
  it("extracts only the Bee connect URL", () => {
    expect(extractConnectUrl("Authentication link: https://bee.computer/connect#req_1\n")).toBe(
      "https://bee.computer/connect#req_1"
    );
    expect(extractConnectUrl("no link here")).toBeNull();
  });

  it("parses start/resume JSON and redacts tokens from diagnostics", () => {
    expect(parseBrokerStart('{"status":"pending","connectUrl":"https://bee.computer/connect#abc"}\n')).toEqual({
      status: "pending",
      connectUrl: "https://bee.computer/connect#abc",
    });
    expect(parseBrokerResume('{"status":"completed","token":"super-secret-token"}\n')).toEqual({
      status: "completed",
      token: "super-secret-token",
    });
    expect(parseBrokerResume('{"status":"pending"}\n')).toEqual({ status: "pending" });
    expect(parseBrokerResume('{"status":"expired"}\n')).toEqual({ status: "expired" });
    const redacted = sanitizeBrokerLine('{"status":"completed","token":"super-secret-token"}');
    expect(redacted).toContain("token=<redacted:18>");
    expect(redacted).not.toContain("super-secret");
    expect(sanitizeBrokerLine("Authentication link: https://bee.computer/connect#abc")).toMatch(/^<non-json:\d+>$/);
  });

  it("rejects a start result that is not a Bee connect URL", () => {
    expect(parseBrokerStart('{"status":"pending","connectUrl":"https://evil.example/x"}\n').status).toBe("error");
  });
});

describe("sealed broker state", () => {
  it("round-trips and fails closed on swap/tamper/age", async () => {
    const state = {
      kind: "cli-broker-v1" as const,
      brokerId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      login: "wife@example.com",
      clientId: "client-1",
      iat: Date.now(),
    };
    const blob = await sealBrokerState(state, "secret");
    expect(await unsealBrokerState(blob, "secret")).toEqual(state);
    expect(await unsealBrokerState(blob, "other")).toBeNull();
    expect(await unsealBrokerState(blob.slice(1), "secret")).toBeNull();
    expect(await unsealBrokerState(blob, "secret", state.iat + 16 * 60 * 1000)).toBeNull();
  });
});

describe("bee proxy is not a hosted multi-user path", () => {
  it("brokerExecArgv only allows start/resume/clear under the helper", () => {
    const id = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    expect(brokerExecArgv("start", id)).toEqual(["bun", "/opt/bee-broker/broker.mjs", "start", id]);
    expect(brokerExecArgv("resume", id)).toEqual(["bun", "/opt/bee-broker/broker.mjs", "resume", id]);
    expect(brokerExecArgv("clear", id)).toEqual(["bun", "/opt/bee-broker/broker.mjs", "clear", id]);
    expect(brokerExecArgv("proxy", id)).toBeNull();
    expect(brokerExecArgv("login", id)).toBeNull();
    expect(JSON.stringify(brokerExecArgv("start", id))).not.toContain("proxy");
  });

  it("helper and image never start bee proxy as a service", () => {
    const helper = readFileSync(new URL("../bridge/broker.mjs", import.meta.url), "utf8");
    const docker = readFileSync(new URL("../bridge/Dockerfile", import.meta.url), "utf8");
    expect(helper).toContain('fail("bee proxy is forbidden in the hosted broker")');
    expect(docker).toContain('ENTRYPOINT ["/usr/bin/caddy"');
    expect(docker).not.toMatch(/ENTRYPOINT.*bee proxy/);
    expect(docker).not.toMatch(/CMD.*bee proxy/);
  });
});

describe("bridge container env stays token-agnostic", () => {
  it("forwards only upstream host facts, never a Bee bearer", () => {
    const env = bridgeContainerEnv({
      BEE_UPSTREAM: "app-api-developer.ce.bee.amazon.dev:443",
      BEE_SNI: "app-api-developer.ce.bee.amazon.dev",
    });
    expect(Object.keys(env).sort()).toEqual(["BEE_SNI", "BEE_UPSTREAM"]);
    expect(JSON.stringify(env)).not.toMatch(/token|secret|bearer/i);
  });
});
