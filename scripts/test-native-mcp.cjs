const { build } = require('esbuild');
const { Miniflare } = require('miniflare');
const assert = require('node:assert/strict');

(async () => {
  const bundle = await build({
    entryPoints: ['test/fixtures/native-mcp-worker.ts'], bundle: true, format: 'esm',
    platform: 'neutral', target: 'es2022', conditions: ['workerd', 'worker', 'browser'],
    mainFields: ['module', 'main'], external: ['cloudflare:*', 'node:*'], write: false,
    plugins: [{ name: 'node-path', setup(b) { b.onResolve({ filter: /^path$/ }, () => ({ path: 'node:path', external: true })); } }],
  });
  const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text,
    compatibilityDate: '2026-06-01', compatibilityFlags: ['nodejs_compat'] });
  let scenarios = 0;
  async function check(scenario) {
    const response = await mf.dispatchFetch('https://fixture.example.test/', { method: 'POST', body: JSON.stringify(scenario) });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.equal(result.fixtureError, undefined);
    assert.equal(result.setupFailure, undefined, 'native OAuth grant setup');
    const denied = ['denied', 'stale', 'missing-bee'].includes(scenario.auth) || (!scenario.selfHost && scenario.policy === 'invalid');
    const unauthenticated = ['missing', 'invalid'].includes(scenario.auth);
    for (const item of result.results) {
      const costly = ['whoami', 'bee_read'].includes(item.name);
      const closed = !scenario.runtime && !scenario.selfHost;
      assert.equal(item.status, unauthenticated ? 401 : denied ? 403 : item.name === 'notifications/initialized' ? 202 : 200, JSON.stringify({ scenario, item }));
      if (!denied && !unauthenticated) {
        assert.equal(item.isError, costly && closed, item.name);
        if (costly && closed) assert.equal(item.paused, true);
        if (item.name === 'initialize') assert.equal(item.protocol, '2025-03-26');
        if (item.name === 'tools/list') assert.ok(item.tools.includes('bee_docs'));
        if (item.name === 'bee_docs') assert.equal(item.docs, true);
      }
    }
    assert.equal(result.runtimeChecks, denied || unauthenticated || scenario.selfHost ? 0 : 2, 'only expensive tools reserve runtime attempts');
    assert.equal(result.bridgeCalls, denied || unauthenticated || (!scenario.runtime && !scenario.selfHost) ? 0 : 2, 'closed/auth-denied must never touch Bee boundary');
    scenarios++;
  }
  try {
    for (const policy of ['absent', 'enabled', 'invalid']) for (const runtime of [false, true]) await check({ policy, runtime });
    for (const auth of ['missing', 'invalid', 'denied', 'stale', 'missing-bee']) for (const policy of ['absent', 'enabled']) await check({ policy, runtime: false, auth });
    for (const runtime of [false, true]) await check({ policy: 'absent', runtime, selfHost: true });
    console.log(JSON.stringify({ nativeScenariosPassed: scenarios, requestsPerScenario: 7, realNetworkCalls: 0 }));
  } finally { await mf.dispose(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
