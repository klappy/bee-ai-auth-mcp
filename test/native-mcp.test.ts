import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { expect, it } from 'vitest';

it('native Worker/OAuth/MCP runtime and authentication matrix (no live Bee)', async () => {
  const { stdout } = await promisify(execFile)(process.execPath, ['scripts/test-native-mcp.cjs'], { timeout: 60_000 });
  expect(JSON.parse(stdout.trim().split('\n').at(-1)!)).toEqual({ nativeScenariosPassed: 18, requestsPerScenario: 7, realNetworkCalls: 0 });
}, 65_000);
