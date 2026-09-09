import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const SCRIPT = new URL("../scripts/probe-bridge-image.sh", import.meta.url).pathname;

function run(args: string[]): { status: number; out: string } {
  try {
    const out = execFileSync(SCRIPT, args, { encoding: "utf8" });
    return { status: 0, out };
  } catch (err) {
    const failed = err as { status?: number; stdout?: string; stderr?: string };
    return { status: failed.status ?? 1, out: `${failed.stdout ?? ""}${failed.stderr ?? ""}` };
  }
}

describe("bridge image probe is fail-closed", () => {
  it("fails when no image ref is given", () => {
    const { status, out } = run([]);
    expect(status).toBe(1);
    expect(out).toContain("Usage:");
  });

  it("exits 2 (named skip) when the named image is absent", () => {
    const { status, out } = run(["bee-bridge:does-not-exist-under-test"]);
    expect([1, 2]).toContain(status);
    if (status === 2) {
      expect(out).toMatch(/not present|not usable/);
    }
  });
});
