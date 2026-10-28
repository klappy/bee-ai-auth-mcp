#!/usr/bin/env node
/**
 * Read one helper JSON line from stdin. Print only sanitized facts.
 * Never echo token, URL, request id, raw keys, or unstructured text.
 */
const CONNECT_URL_RE = /^https:\/\/bee\.computer\/connect#[A-Za-z0-9_-]+$/;
const ALLOWED_STATUS = new Set(["pending", "expired", "cleared", "completed", "error"]);

const raw = await new Promise((resolve, reject) => {
  const chunks = [];
  process.stdin.on("data", (c) => chunks.push(c));
  process.stdin.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  process.stdin.on("error", reject);
});

let status = "unparseable";
let hasConnectUrl = false;
let connectUrlShape = false;
let hasExpiresAt = false;
let hasToken = false;
let errorClass = "";

for (const line of raw.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("{")) continue;
  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    continue;
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) continue;
  if (typeof parsed.status === "string" && ALLOWED_STATUS.has(parsed.status)) {
    status = parsed.status;
  }
  if (typeof parsed.connectUrl === "string") {
    hasConnectUrl = true;
    connectUrlShape = CONNECT_URL_RE.test(parsed.connectUrl);
  }
  if (typeof parsed.expiresAt === "string" && parsed.expiresAt.length > 0) {
    hasExpiresAt = true;
  }
  if (typeof parsed.token === "string" && parsed.token.length > 0) {
    hasToken = true;
  }
  if (parsed.status === "error") {
    errorClass = typeof parsed.message === "string" && parsed.message.includes("connect URL")
      ? "no-connect-url"
      : "helper-error";
  }
  break;
}

process.stdout.write(
  JSON.stringify({ status, hasConnectUrl, connectUrlShape, hasExpiresAt, hasToken, errorClass }) + "\n"
);
