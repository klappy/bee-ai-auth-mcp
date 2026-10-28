import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const SCRIPT = new URL("../scripts/sanitize-broker-probe.mjs", import.meta.url).pathname;

function run(stdin: string): Record<string, unknown> {
  const out = execFileSync(process.execPath, [SCRIPT], { encoding: "utf8", input: stdin });
  expect(out).not.toContain("bee.computer");
  expect(out).not.toContain("token-");
  expect(out).not.toContain("secret");
  return JSON.parse(out) as Record<string, unknown>;
}

describe("broker probe sanitizer", () => {
  it("keeps only pending shape flags and drops the connect URL", () => {
    const parsed = run(
      '{"status":"pending","connectUrl":"https://bee.computer/connect#req_should_never_leak","expiresAt":"2099-01-01T00:00:00.000Z"}\n'
    );
    expect(parsed).toEqual({
      status: "pending",
      hasConnectUrl: true,
      connectUrlShape: true,
      hasExpiresAt: true,
      hasToken: false,
      errorClass: "",
    });
  });

  it("rejects a non-Bee URL without echoing it", () => {
    const parsed = run('{"status":"pending","connectUrl":"https://evil.example/x"}\n');
    expect(parsed.status).toBe("pending");
    expect(parsed.hasConnectUrl).toBe(true);
    expect(parsed.connectUrlShape).toBe(false);
  });

  it("flags a token without echoing it", () => {
    const parsed = run('{"status":"completed","token":"super-secret-token"}\n');
    expect(parsed).toMatchObject({ status: "completed", hasToken: true });
    expect(JSON.stringify(parsed)).not.toContain("super-secret");
  });

  it("classifies missing-connect-url helper errors", () => {
    const parsed = run('{"status":"error","message":"hosted Bee CLI did not print a connect URL"}\n');
    expect(parsed.status).toBe("error");
    expect(parsed.errorClass).toBe("no-connect-url");
  });
});
