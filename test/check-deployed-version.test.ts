import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

const SCRIPT = new URL("../scripts/check-deployed-version.sh", import.meta.url).pathname;
const HEAD = "a46c35f17110cbe1f951ece0b6c4cb5384c6ea15";

function run(expected: string, deployed: string): { status: number; out: string } {
  try {
    const out = execFileSync(SCRIPT, [expected, deployed], { encoding: "utf8" });
    return { status: 0, out };
  } catch (err) {
    const failed = err as { status?: number; stdout?: string; stderr?: string };
    return { status: failed.status ?? 1, out: `${failed.stdout ?? ""}${failed.stderr ?? ""}` };
  }
}

describe("deployed /version gate is fail-closed", () => {
  it("accepts an exact SHA match before smoke would run", () => {
    const { status, out } = run(HEAD, HEAD);
    expect(status).toBe(0);
    expect(out).toContain("serving the commit under test");
  });

  it("accepts a short SHA that is a prefix of the PR head", () => {
    expect(run(HEAD, HEAD.slice(0, 7)).status).toBe(0);
  });

  it("fails on SHA mismatch", () => {
    const { status, out } = run(HEAD, "adee7c66a59268507e4b57576b6f904ba5f5078f");
    expect(status).toBe(1);
    expect(out).toContain("not serving the commit under test");
  });

  it("fails on empty /version (the former prefix-match hole)", () => {
    const { status, out } = run(HEAD, "");
    expect(status).toBe(1);
    expect(out).toContain("empty or unreachable");
  });

  it("fails on a non-SHA body", () => {
    expect(run(HEAD, "ok").status).toBe(1);
    expect(run(HEAD, '{"sha":"' + HEAD + '"}').status).toBe(1);
  });
});
