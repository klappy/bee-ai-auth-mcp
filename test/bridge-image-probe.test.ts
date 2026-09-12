import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SCRIPT = new URL("../scripts/probe-bridge-image.sh", import.meta.url).pathname;

// Unit tests exercise the real script's exit semantics, not the seat's Docker
// daemon. Actual image acceptance remains scripts/probe-bridge-image.sh <image>.
function run(args: string[], mode: 'unavailable' | 'missing' = 'unavailable'): { status: number; out: string; calls: string } {
  const dir = mkdtempSync(join(tmpdir(), 'bee-probe-unit-'));
  const log = join(dir, 'calls');
  writeFileSync(log, '');
  const fixture = `#!/bin/sh
printf '%s\\n' "$*" >> "$PROBE_UNIT_LOG"
case "$*" in
  info) [ "$PROBE_UNIT_MODE" = missing ] && exit 0; exit 1 ;;
  'image inspect bee-bridge:does-not-exist-under-test') exit 1 ;;
  *) exit 99 ;;
esac
`;
  writeFileSync(join(dir, 'docker'), fixture, { mode: 0o755 });
  writeFileSync(join(dir, 'sudo'), '#!/bin/sh\nprintf "sudo %s\\n" "$*" >> "$PROBE_UNIT_LOG"\nexit 1\n', { mode: 0o755 });
  try {
    let status = 0; let out = '';
    try {
      out = execFileSync(SCRIPT, args, {
        encoding: 'utf8', timeout: 2000, killSignal: 'SIGKILL',
        env: { ...process.env, PATH: dir, PROBE_UNIT_LOG: log, PROBE_UNIT_MODE: mode },
      });
    } catch (err) {
      const failed = err as { status?: number; stdout?: string; stderr?: string; code?: string };
      // A timeout is a test failure, never a synthetic skip/pass.
      if (failed.code === 'ETIMEDOUT') throw err;
      status = failed.status ?? 1; out = `${failed.stdout ?? ''}${failed.stderr ?? ''}`;
    }
    return { status, out, calls: readFileSync(log, 'utf8') };
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

describe('bridge image probe is fail-closed', () => {
  it('fails when no image ref is given without invoking Docker', () => {
    const result = run([]);
    expect(result.status).toBe(1); expect(result.out).toContain('Usage:'); expect(result.calls).toBe('');
  });
  it('exits 2 when Docker is unavailable and never runs a container', () => {
    const result = run(['bee-bridge:does-not-exist-under-test']);
    expect(result.status).toBe(2); expect(result.out).toBe('Docker is not usable on this seat.\n');
    expect(result.calls).toBe('info\nsudo -n docker info\n');
  });
  it('exits 2 when the named image is absent and never runs a container', () => {
    const result = run(['bee-bridge:does-not-exist-under-test'], 'missing');
    expect(result.status).toBe(2); expect(result.out).toBe("Image 'bee-bridge:does-not-exist-under-test' is not present.\n");
    expect(result.calls).toBe('info\nimage inspect bee-bridge:does-not-exist-under-test\n');
  });
});
