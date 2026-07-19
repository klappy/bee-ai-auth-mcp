/**
 * Unit coverage for the device-aware consent render: CTA ordering by device
 * class, and the copyable connect-URL affordance present in both variants.
 */
import { describe, it, expect, vi } from "vitest";

// bee-auth.ts imports @cloudflare/containers (for the bridge stub used by the
// /consent and /pairing/status handlers), which pulls in the `cloudflare:workers`
// runtime module — unavailable under plain-Node vitest. Stub it so this pure
// render logic can be unit-tested without a workerd pool; unrelated to the change under test.
vi.mock("@cloudflare/containers", () => ({ getContainer: () => ({}) }));

const { consentForm, isMobileUA } = await import("../src/bee-auth");

const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const ANDROID_UA = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36";
const DESKTOP_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

function reqWith(headers: Record<string, string>): Request {
  return new Request("https://relay.example/callback", { headers });
}

describe("isMobileUA", () => {
  it("detects common mobile UAs", () => {
    expect(isMobileUA(reqWith({ "user-agent": IPHONE_UA }))).toBe(true);
    expect(isMobileUA(reqWith({ "user-agent": ANDROID_UA }))).toBe(true);
  });

  it("treats a desktop UA as non-mobile", () => {
    expect(isMobileUA(reqWith({ "user-agent": DESKTOP_UA }))).toBe(false);
  });

  it("honors the sec-ch-ua-mobile client hint even over a desktop-looking UA", () => {
    expect(isMobileUA(reqWith({ "user-agent": DESKTOP_UA, "sec-ch-ua-mobile": "?1" }))).toBe(true);
  });

  it("defaults to non-mobile when no UA header is present", () => {
    expect(isMobileUA(reqWith({}))).toBe(false);
  });
});

async function bodyOf(res: Response): Promise<string> {
  return res.text();
}

describe("consentForm render", () => {
  it("mobile: puts the approve deep-link CTA ahead of the (collapsed) QR", async () => {
    const body = await bodyOf(consentForm("klappy", "signed-blob", true));
    const approveIdx = body.indexOf('id="approve-btn"');
    const qrDetailsIdx = body.indexOf('id="qr-details"');
    const qrBoxIdx = body.indexOf('id="qr-box"');
    expect(approveIdx).toBeGreaterThan(-1);
    expect(qrDetailsIdx).toBeGreaterThan(-1);
    // Hero CTA renders before the QR, and the QR lives inside a <details> (collapsed by default).
    expect(approveIdx).toBeLessThan(qrDetailsIdx);
    expect(qrDetailsIdx).toBeLessThan(qrBoxIdx);
    expect(body).toContain('class="btn-hero"');
  });

  it("desktop: has no hero approve CTA and the QR is not collapsed", async () => {
    const body = await bodyOf(consentForm("klappy", "signed-blob", false));
    expect(body).not.toContain('id="approve-btn"');
    expect(body).not.toContain('id="qr-details"');
    expect(body).not.toContain('class="btn-hero"');
    expect(body).toContain('id="qr-box"');
    expect(body).toContain('id="qr-link"');
  });

  it("both variants expose a copyable connect-URL field for manual Bee ID entry", async () => {
    for (const isMobile of [true, false]) {
      const body = await bodyOf(consentForm("klappy", "signed-blob", isMobile));
      expect(body).toContain('id="connect-url-pane"');
      expect(body).toContain('id="connect-url-text"');
      expect(body).toContain('id="copy-connect-url"');
      expect(body).toContain("Enter Bee ID");
    }
  });

  it("carries the signed state and surfaces a consent error when given", async () => {
    const res = consentForm("klappy", "signed-blob", false, "Please paste your Bee API token.");
    expect(res.status).toBe(400);
    const body = await res.text();
    expect(body).toContain("signed-blob");
    expect(body).toContain("Please paste your Bee API token.");
  });
});
