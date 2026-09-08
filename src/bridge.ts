/**
 * BeeBridge — the private-CA bridge as a bound Cloudflare Container (D0028, ledger
 * E0014). The relay Worker reaches it over an INTERNAL Worker->container call
 * (`getContainer(env.BEE_BRIDGE).fetch(...)`), never a public hostname. Inside the
 * container, caddy (see bridge/Dockerfile + bridge/Caddyfile) listens on
 * `defaultPort` and re-originates TLS to Bee trusting bee-ca.pem — the one thing a
 * stock Worker `fetch` cannot do because Bee's direct API uses a private CA
 * (ledger E0012).
 *
 * Data-plane job: pass BEE_UPSTREAM/BEE_SNI into caddy. Token-AGNOSTIC shared
 * infrastructure (E0014): every /v1 request carries its own user's bearer in
 * Authorization — never injected here, never stored, never logged. One shared
 * instance (`getContainer` default); do NOT add per-user instance names.
 *
 * Auth-broker job (kitchen CLI-BROKER-AMENDMENT-2026-09-08): RPC methods run
 * Bee CLI via Container exec under an opaque per-attempt BEE_CONFIG_DIR, then
 * delete that directory. This is a one-shot handshake, not a shared Bee login.
 *
 * The runtime must SEE this class for the `migrations` entry (wrangler.jsonc
 * `new_sqlite_classes: ["BeeBridge"]`) to register the Durable Object, so it is
 * re-exported from src/index.ts.
 */

import { Container } from "@cloudflare/containers";
import {
  BROKER_HELPER_ARGV,
  assertBrokerId,
  brokerConfigDir,
  parseBrokerResume,
  parseBrokerStart,
  type BrokerClearResult,
  type BrokerResumeResult,
  type BrokerStartResult,
} from "./broker";
import type { Env } from "./types";

/** Only host + SNI are passed into the container process environment. */
export function bridgeContainerEnv(env: Pick<Env, "BEE_UPSTREAM" | "BEE_SNI">): {
  BEE_UPSTREAM: string;
  BEE_SNI: string;
} {
  return { BEE_UPSTREAM: env.BEE_UPSTREAM, BEE_SNI: env.BEE_SNI };
}

type ContainerExec = {
  running: boolean;
  exec(
    cmd: string[],
    options?: { env?: Record<string, string> }
  ): Promise<{ output(): Promise<{ stdout: ArrayBuffer; stderr: ArrayBuffer; exitCode: number }> }>;
};

export class BeeBridge extends Container<Env> {
  /** caddy's internal listener (bridge/Caddyfile `:8080` site). The Worker's
   *  container fetch is forwarded here by the Containers runtime. */
  defaultPort = 8080;
  /** Idle the instance after inactivity; it cold-starts on the next request.
   *  whoami is bursty, not steady, so there is no value in holding it warm. */
  sleepAfter = "10m";

  /** A Cloudflare container does NOT inherit the Worker's vars/secrets, so caddy's
   *  {$BEE_UPSTREAM}/{$BEE_SNI} (bridge/Caddyfile) would start empty and the
   *  reverse_proxy to Bee would fail. Pass the operator-set secrets through as the
   *  container's environment. Token-AGNOSTIC still holds: no per-user bearer is set
   *  here — that rides the Authorization header per request, straight to Bee. */
  envVars = bridgeContainerEnv(this.env);

  /** Cold-start signal (telemetry only — shape, not application logic). `onStart`
   *  fires when the container starts; the first request after a start is served
   *  "cold". We surface that to the Worker as an `x-bridge-cold` response header
   *  so telemetry can split the bimodal cold/warm latency (the whole point of the
   *  baseline). Read+cleared per request; the DO instance loses it on eviction,
   *  which is exactly a cold start. See docs/telemetry-governance.md. */
  private coldPending = false;

  override onStart(): void {
    this.coldPending = true;
  }

  override async fetch(request: Request): Promise<Response> {
    try {
      const res = await super.fetch(request);
      // onStart fires inside super.fetch on a cold start, so read the flag after.
      const cold = this.coldPending;
      const headers = new Headers(res.headers);
      headers.set("x-bridge-cold", cold ? "1" : "0");
      return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
    } finally {
      // Clear even when super.fetch throws, so a failed cold request can't leave
      // the flag set and mark later warm requests as cold in telemetry.
      this.coldPending = false;
    }
  }

  /** One-shot CLI start: print connect URL only. Never a shared login. */
  async startBeeBroker(brokerId: string): Promise<BrokerStartResult> {
    if (!assertBrokerId(brokerId)) return { status: "error", message: "invalid broker id" };
    try {
      return parseBrokerStart(await this.execBroker(brokerId, "start"));
    } catch {
      return { status: "error", message: "hosted Bee CLI broker unreachable" };
    }
  }

  /** Bounded resume under the same opaque directory. Token is returned only
   *  to the Worker invocation that asked — never logged. */
  async resumeBeeBroker(brokerId: string): Promise<BrokerResumeResult> {
    if (!assertBrokerId(brokerId)) return { status: "error", message: "invalid broker id" };
    try {
      return parseBrokerResume(await this.execBroker(brokerId, "resume"));
    } catch {
      return { status: "error", message: "hosted Bee CLI broker unreachable" };
    }
  }

  async clearBeeBroker(brokerId: string): Promise<BrokerClearResult> {
    if (!assertBrokerId(brokerId)) return { status: "error", message: "invalid broker id" };
    try {
      await this.execBroker(brokerId, "clear");
      return { status: "cleared" };
    } catch {
      return { status: "error", message: "hosted Bee CLI broker unreachable" };
    }
  }

  private containerExec(): ContainerExec | null {
    const container = (this.ctx as DurableObjectState & { container?: ContainerExec }).container;
    return container ?? null;
  }

  private async execBroker(brokerId: string, command: "start" | "resume" | "clear"): Promise<string> {
    const dir = brokerConfigDir(brokerId);
    if (!dir) throw new Error("invalid broker id");
    const container = this.containerExec();
    if (!container) throw new Error("container exec unavailable");
    if (!container.running) {
      await this.startAndWaitForPorts(this.defaultPort);
    }
    const process = await container.exec([...BROKER_HELPER_ARGV, command, brokerId], {
      env: {
        BEE_CONFIG_DIR: dir,
        BEE_FORCE_FILE_STORE: "1",
        HOME: "/tmp",
        PATH: "/opt/bee-cli/node_modules/.bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
      },
    });
    const output = await process.output();
    // Decode stdout for the parser only. Do not log it — resume may carry a token.
    return new TextDecoder().decode(output.stdout);
  }
}
