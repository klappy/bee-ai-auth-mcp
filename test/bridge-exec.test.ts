/**
 * Bounded regression for BeeBridge exec exit + clear honesty.
 *
 * Finding at e912920 (source inspection): execBroker ignored exitCode and
 * clearBeeBroker returned {status:'cleared'} after any successful exec()
 * return — empty/malformed/nonzero included.
 */
import { describe, expect, it, vi } from "vitest";

vi.mock("@cloudflare/containers", () => ({
  Container: class {
    env = {};
    ctx = {};
  },
  getContainer: () => ({}),
}));

import { BeeBridge } from "../src/bridge";

const ID = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

function bridgeWithExec(output: { stdout: string; stderr: string; exitCode: number }): BeeBridge {
  const bridge = Object.create(BeeBridge.prototype) as BeeBridge;
  (bridge as unknown as { ctx: unknown }).ctx = {
    container: {
      running: true,
      exec: async () => ({
        output: async () => ({
          stdout: new TextEncoder().encode(output.stdout).buffer,
          stderr: new TextEncoder().encode(output.stderr).buffer,
          exitCode: output.exitCode,
        }),
      }),
    },
  };
  return bridge;
}

describe("BeeBridge exec exit and clear honesty", () => {
  it("valid clear JSON + exit 0 reports cleared", async () => {
    const bridge = bridgeWithExec({
      stdout: '{"status":"cleared"}\n',
      stderr: "",
      exitCode: 0,
    });
    expect(await bridge.clearBeeBroker(ID)).toEqual({ status: "cleared" });
  });

  it("nonzero clear exit does not report cleared", async () => {
    const bridge = bridgeWithExec({
      stdout: "",
      stderr: "EACCES: permission denied",
      exitCode: 1,
    });
    const result = await bridge.clearBeeBroker(ID);
    expect(result.status).toBe("error");
    expect(JSON.stringify(result)).not.toMatch(/EACCES|permission denied|token/i);
  });

  it("empty clear stdout + exit 0 does not report cleared", async () => {
    const bridge = bridgeWithExec({ stdout: "", stderr: "", exitCode: 0 });
    expect(await bridge.clearBeeBroker(ID)).toEqual({
      status: "error",
      message: "hosted Bee CLI broker returned no result",
    });
  });

  it("malformed clear stdout + exit 0 does not report cleared", async () => {
    const bridge = bridgeWithExec({ stdout: "not-json\n", stderr: "", exitCode: 0 });
    expect(await bridge.clearBeeBroker(ID)).toEqual({
      status: "error",
      message: "hosted Bee CLI broker returned no result",
    });
  });

  it("cleared JSON + nonzero exit does not report cleared", async () => {
    const bridge = bridgeWithExec({
      stdout: '{"status":"cleared"}\n',
      stderr: "rm failed after emit",
      exitCode: 2,
    });
    const result = await bridge.clearBeeBroker(ID);
    expect(result.status).toBe("error");
    expect(JSON.stringify(result)).not.toContain("rm failed");
  });

  it("valid start pending + exit 0 is unchanged", async () => {
    const bridge = bridgeWithExec({
      stdout: '{"status":"pending","connectUrl":"https://bee.computer/connect#abc"}\n',
      stderr: "",
      exitCode: 0,
    });
    expect(await bridge.startBeeBroker(ID)).toEqual({
      status: "pending",
      connectUrl: "https://bee.computer/connect#abc",
    });
  });

  it("pending start JSON + nonzero exit fails closed", async () => {
    const bridge = bridgeWithExec({
      stdout: '{"status":"pending","connectUrl":"https://bee.computer/connect#abc"}\n',
      stderr: "bee crashed after print",
      exitCode: 1,
    });
    const result = await bridge.startBeeBroker(ID);
    expect(result.status).toBe("error");
    expect(JSON.stringify(result)).not.toContain("bee crashed");
    expect(JSON.stringify(result)).not.toContain("connect#");
  });

  it("valid resume completed + exit 0 is unchanged", async () => {
    const bridge = bridgeWithExec({
      stdout: '{"status":"completed","token":"invitee-bee-token"}\n',
      stderr: "",
      exitCode: 0,
    });
    expect(await bridge.resumeBeeBroker(ID)).toEqual({
      status: "completed",
      token: "invitee-bee-token",
    });
  });

  it("completed resume JSON + nonzero exit fails closed and does not return the token", async () => {
    const bridge = bridgeWithExec({
      stdout: '{"status":"completed","token":"invitee-bee-token"}\n',
      stderr: "unlink failed",
      exitCode: 1,
    });
    const result = await bridge.resumeBeeBroker(ID);
    expect(result.status).toBe("error");
    expect(JSON.stringify(result)).not.toContain("invitee-bee-token");
    expect(JSON.stringify(result)).not.toContain("unlink failed");
  });
});
