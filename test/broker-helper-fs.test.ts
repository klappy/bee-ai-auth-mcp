/**
 * Executes the compiled-helper takeToken against two real directories.
 * Completing A must not read or delete B.
 */
import { mkdirSync, writeFileSync, existsSync, rmSync, readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { clear, dirFor, pairingPath, takeToken, tokenPath } from "../bridge/broker.mjs";

const A = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const B = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

function seed(id: string, token: string): void {
  mkdirSync(dirFor(id), { recursive: true, mode: 0o700 });
  writeFileSync(tokenPath(id), token, { encoding: "utf8", mode: 0o600 });
  writeFileSync(pairingPath(id), JSON.stringify({ expiresAt: new Date(Date.now() + 60_000).toISOString() }), {
    encoding: "utf8",
    mode: 0o600,
  });
}

function wipe(id: string): void {
  rmSync(dirFor(id), { recursive: true, force: true });
}

afterEach(() => {
  wipe(A);
  wipe(B);
});

describe("helper takeToken isolation", () => {
  it("taking A cannot read or delete B", () => {
    seed(A, "token-a");
    seed(B, "token-b");
    expect(takeToken(A)).toBe("token-a");
    expect(existsSync(tokenPath(A))).toBe(false);
    expect(existsSync(pairingPath(A))).toBe(false);
    expect(readFileSync(tokenPath(B), "utf8")).toBe("token-b");
    expect(existsSync(pairingPath(B))).toBe(true);
    expect(takeToken(B)).toBe("token-b");
    expect(existsSync(tokenPath(B))).toBe(false);
  });

  it("clearing A does not remove B", () => {
    seed(A, "token-a");
    seed(B, "token-b");
    clear(A);
    expect(existsSync(dirFor(A))).toBe(false);
    expect(readFileSync(tokenPath(B), "utf8")).toBe("token-b");
  });
});
