#!/usr/bin/env bun
/**
 * Narrow Bee CLI broker helper. Invoked only via Container exec — not a
 * long-lived service, not a public proxy.
 *
 *   bun /opt/bee-broker/broker.mjs start  <32-hex>
 *   bun /opt/bee-broker/broker.mjs resume <32-hex>
 *   bun /opt/bee-broker/broker.mjs clear  <32-hex>
 *
 * Prints exactly one JSON line on stdout. A token appears only on resume
 * completed. Do not log this process's stdout in the Worker.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const BROKER_ID_RE = /^[a-f0-9]{32}$/;
const ROOT = "/tmp/bee-broker";
const CONNECT_URL_RE = /https:\/\/bee\.computer\/connect#[A-Za-z0-9_-]+/;

function emit(obj) {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

function fail(message) {
  emit({ status: "error", message });
  process.exit(2);
}

function assertId(id) {
  if (!BROKER_ID_RE.test(id || "")) fail("invalid broker id");
  return id;
}

function dirFor(id) {
  return `${ROOT}/${id}`;
}

function resolvedDir(id) {
  const target = resolve(dirFor(id));
  const root = resolve(ROOT);
  if (target !== root && !target.startsWith(root + "/")) fail("invalid broker path");
  return target;
}

function envFor(id) {
  return {
    ...process.env,
    BEE_CONFIG_DIR: dirFor(id),
    BEE_FORCE_FILE_STORE: "1",
    HOME: "/tmp",
  };
}

function tokenPath(id) {
  return `${dirFor(id)}/token-prod`;
}

function pairingPath(id) {
  return `${dirFor(id)}/pairing-prod.json`;
}

function readToken(id) {
  const path = tokenPath(id);
  if (!existsSync(path)) return null;
  try {
    const value = readFileSync(path, "utf8").trim();
    return value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

function pairingExpiry(id) {
  const path = pairingPath(id);
  if (!existsSync(path)) return null;
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8"));
    return typeof parsed?.expiresAt === "string" ? parsed.expiresAt : null;
  } catch {
    return null;
  }
}

function pairingExpired(expiresAt) {
  const ms = Date.parse(expiresAt);
  return Number.isNaN(ms) || Date.now() >= ms;
}

function runBee(id, args, timeoutMs) {
  return spawnSync("bee", args, {
    env: envFor(id),
    encoding: "utf8",
    timeout: timeoutMs,
    maxBuffer: 64 * 1024,
  });
}

function start(id) {
  mkdirSync(resolvedDir(id), { recursive: true, mode: 0o700 });
  const result = runBee(id, ["login", "--no-wait"], 30_000);
  const text = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const connectUrl = text.match(CONNECT_URL_RE)?.[0];
  if (!connectUrl) {
    fail("hosted Bee CLI did not print a connect URL");
  }
  const expiresAt = pairingExpiry(id) ?? undefined;
  emit({ status: "pending", connectUrl, ...(expiresAt ? { expiresAt } : {}) });
}

function resume(id) {
  const existing = readToken(id);
  if (existing) {
    emit({ status: "completed", token: existing });
    return;
  }
  const expiresAt = pairingExpiry(id);
  if (!expiresAt) {
    emit({ status: "expired" });
    return;
  }
  if (pairingExpired(expiresAt)) {
    emit({ status: "expired" });
    return;
  }
  // Bounded resume: the upstream CLI polls until deadline. Kill after a few
  // seconds so the consent page can keep polling without a 5-minute exec.
  runBee(id, ["login"], 8_000);
  const token = readToken(id);
  if (token) {
    emit({ status: "completed", token });
    return;
  }
  if (pairingExpired(pairingExpiry(id) ?? expiresAt)) {
    emit({ status: "expired" });
    return;
  }
  emit({ status: "pending" });
}

function clear(id) {
  const target = resolvedDir(id);
  if (existsSync(target)) {
    rmSync(target, { recursive: true, force: true });
  }
  emit({ status: "cleared" });
}

const [cmd, idArg] = process.argv.slice(2);
if (cmd === "proxy" || process.argv.includes("proxy")) {
  fail("bee proxy is forbidden in the hosted broker");
}
const id = assertId(idArg);
if (cmd === "start") start(id);
else if (cmd === "resume") resume(id);
else if (cmd === "clear") clear(id);
else fail("unknown broker command");
