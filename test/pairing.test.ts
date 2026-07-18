/**
 * Unit coverage for the server-side QR pairing module.
 *
 * The envelope fixtures are built with real nacl.box against a known keypair,
 * so a passing round-trip proves wire compatibility with the CLI's
 * crypto_box format (version || nonce || senderPk || box), not just internal
 * consistency. Live pairing-service behavior (idempotent poll, expiry) was
 * verified by probe on 2026-07-05 — see the execution ledger.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import nacl from "tweetnacl";
import {
  BEE_CLI_APP_ID,
  PAIRING_URL,
  b64ToBytes,
  buildConnectUrl,
  bytesToB64,
  generatePairingKeyPair,
  openPairingEnvelope,
  postPairing,
  sealPairingState,
  unsealPairingState,
  type SealedPairingState,
} from "../src/pairing";

const te = (s: string) => new TextEncoder().encode(s);

function packEnvelope(
  version: number,
  nonce: Uint8Array,
  senderPk: Uint8Array,
  box: Uint8Array
): string {
  const packed = new Uint8Array(1 + nonce.length + senderPk.length + box.length);
  packed[0] = version;
  packed.set(nonce, 1);
  packed.set(senderPk, 1 + nonce.length);
  packed.set(box, 1 + nonce.length + senderPk.length);
  return bytesToB64(packed);
}

describe("openPairingEnvelope", () => {
  it("round-trips a real crypto_box envelope (CLI wire format)", () => {
    const receiver = nacl.box.keyPair();
    const sender = nacl.box.keyPair();
    const nonce = nacl.randomBytes(24);
    const box = nacl.box(te("bee-token-123"), nonce, receiver.publicKey, sender.secretKey);
    const b64 = packEnvelope(1, nonce, sender.publicKey, box);
    expect(openPairingEnvelope(b64, receiver.secretKey)).toBe("bee-token-123");
  });

  it("rejects wrong version, truncation, wrong key, and garbage", () => {
    const receiver = nacl.box.keyPair();
    const sender = nacl.box.keyPair();
    const nonce = nacl.randomBytes(24);
    const box = nacl.box(te("t"), nonce, receiver.publicKey, sender.secretKey);

    expect(openPairingEnvelope(packEnvelope(2, nonce, sender.publicKey, box), receiver.secretKey)).toBeNull();
    expect(openPairingEnvelope(bytesToB64(new Uint8Array(10)), receiver.secretKey)).toBeNull();
    const other = nacl.box.keyPair();
    expect(openPairingEnvelope(packEnvelope(1, nonce, sender.publicKey, box), other.secretKey)).toBeNull();
    expect(openPairingEnvelope("!!!not-base64!!!", receiver.secretKey)).toBeNull();
  });
});

describe("sealed pairing state", () => {
  const state: SealedPairingState = {
    pk: "pk-b64",
    sk: "sk-b64",
    requestId: "req_1",
    login: "klappy",
    clientId: "client-abc",
    iat: Date.now(),
  };

  it("round-trips under the right secret", async () => {
    const blob = await sealPairingState(state, "hunter2");
    expect(await unsealPairingState(blob, "hunter2")).toEqual(state);
  });

  it("rejects tamper, wrong secret, stale state, and garbage", async () => {
    const blob = await sealPairingState(state, "hunter2");
    const flipped = (blob[10] === "A" ? "B" : "A") as string;
    const tampered = blob.slice(0, 10) + flipped + blob.slice(11);
    expect(await unsealPairingState(tampered, "hunter2")).toBeNull();
    expect(await unsealPairingState(blob, "wrong-secret")).toBeNull();
    expect(await unsealPairingState(blob, "hunter2", state.iat + 16 * 60 * 1000)).toBeNull();
    expect(await unsealPairingState("garbage", "hunter2")).toBeNull();
  });
});

describe("postPairing", () => {
  afterEach(() => vi.restoreAllMocks());

  const respond = (status: number, body: unknown) =>
    vi.fn(async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

  it("sends { app_id, publicKey } to the pairing endpoint and maps pending", async () => {
    const fetcher = respond(200, {
      ok: true,
      status: "pending",
      requestId: "r1",
      expiresAt: "2026-07-06T00:54:36.370Z",
    });
    const out = await postPairing("PUBKEY_B64", fetcher);
    expect(out).toEqual({ status: "pending", requestId: "r1", expiresAt: "2026-07-06T00:54:36.370Z" });

    const call = (fetcher as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call[0]).toBe(PAIRING_URL);
    expect(JSON.parse(call[1].body)).toEqual({ app_id: BEE_CLI_APP_ID, publicKey: "PUBKEY_B64" });
  });

  it("maps completed, expired, http errors, and unexpected shapes", async () => {
    expect(
      await postPairing("P", respond(200, { status: "completed", requestId: "r1", encryptedToken: "ZZ" }))
    ).toEqual({ status: "completed", requestId: "r1", encryptedToken: "ZZ" });

    expect(await postPairing("P", respond(200, { status: "expired", requestId: "r1" }))).toEqual({
      status: "expired",
    });

    expect((await postPairing("P", respond(500, { nope: true }))).status).toBe("error");
    expect((await postPairing("P", respond(200, { status: "??" }))).status).toBe("error");
  });

  it("accepts completed WITHOUT requestId (falls back to empty string)", async () => {
    expect(
      await postPairing("P", respond(200, { ok: true, status: "completed", encryptedToken: "ZZ" }))
    ).toEqual({ status: "completed", requestId: "", encryptedToken: "ZZ" });
  });

  it("still maps completed WITH requestId unchanged", async () => {
    expect(
      await postPairing("P", respond(200, { ok: true, status: "completed", requestId: "r9", encryptedToken: "ZZ" }))
    ).toEqual({ status: "completed", requestId: "r9", encryptedToken: "ZZ" });
  });

  it("redacts token-bearing keys in unexpected-shape diagnostics", async () => {
    const secret = "S".repeat(52);
    const out = await postPairing(
      "P",
      respond(200, { ok: true, status: "done?", encryptedToken: secret })
    );
    expect(out.status).toBe("error");
    const message = (out as { status: "error"; message: string }).message;
    expect(message).toContain("unexpected pairing response shape (http 200)");
    expect(message).toContain("<redacted:52>");
    expect(message).not.toContain(secret);
  });

  it("keeps pending and expired mappings unchanged after the diagnostics change", async () => {
    expect(
      await postPairing("P", respond(200, { ok: true, status: "pending", requestId: "r1", expiresAt: "2026-07-18T00:00:00.000Z" }))
    ).toEqual({ status: "pending", requestId: "r1", expiresAt: "2026-07-18T00:00:00.000Z" });
    expect(await postPairing("P", respond(200, { ok: true, status: "expired", requestId: "r1" }))).toEqual({
      status: "expired",
    });
  });
});

describe("helpers", () => {
  it("builds the connect URL from the requestId only (no secret in the QR)", () => {
    expect(buildConnectUrl("abc123")).toBe("https://bee.computer/connect#abc123");
  });

  it("base64 round-trips and keypairs have NaCl shapes", () => {
    const bytes = new Uint8Array([0, 1, 2, 127, 250]);
    expect(b64ToBytes(bytesToB64(bytes))).toEqual(bytes);
    const kp = generatePairingKeyPair();
    expect(b64ToBytes(kp.publicKeyB64).length).toBe(32);
    expect(kp.secretKey.length).toBe(32);
  });
});
