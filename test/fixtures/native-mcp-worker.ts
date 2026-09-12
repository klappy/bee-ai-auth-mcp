/** Test-only entry: real staging/self-host Worker, OAuth provider and MCP SDK.
 * Only storage, admission/runtime RPC and the Bee network boundary are synthetic.
 * This fixture is never an application entry or deployment target.
 */
import staging from '../../src/staging';
import selfHost from '../../src/index';

export default {
  async fetch(input: Request) {
    try {
    const scenario = await input.json() as any;
    const origin = 'https://staging.example.test';
    const redirect = 'https://client.example.test/callback';
    const record = { id: 'synthetic', email: 'synthetic@example.test', status: 'approved', epoch: 0 };
    const kv = new Map<string, string>();
    let runtimeChecks = 0, bridgeCalls = 0;
    const stub = {
      admission: async () => record,
      reserveValidationRequest: async () => { runtimeChecks++; return scenario.runtime; },
      fetch: async () => { bridgeCalls++; return Response.json({ id: 'synthetic-bee', conversations: [] }); },
      quota: async () => ({ ok: true, reservation: 'synthetic-reservation', used: 0, remaining: 5 }),
    };
    const env: any = {
      BEE_ENVIRONMENT: 'staging', SIGNUP_ENABLED: 'true',
      BEE_BRIDGE: { idFromName: (name: string) => name, get: () => stub },
      OAUTH_KV: {
        get: async (key: string, type?: any) => { const value = kv.get(key); return value === undefined ? null : (type === 'json' || type?.type === 'json') ? JSON.parse(value) : value; },
        put: async (key: string, value: string) => { kv.set(key, value); },
        delete: async (key: string) => { kv.delete(key); },
        list: async ({ prefix }: any) => ({ keys: [...kv.keys()].filter(key => key.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
      },
    };
    const ctx = { waitUntil: () => {} } as any;
    const entry = scenario.selfHost ? selfHost : staging;
    // Initialize the real provider's helper API, then create synthetic grant
    // custody via its maintained helper. This does not simulate email delivery.
    await selfHost.fetch(new Request(origin + '/synthetic-helper-initialization'), env, ctx);
    const helper = env.OAUTH_PROVIDER;
    const client = await helper.createClient({ redirectUris: [redirect], tokenEndpointAuthMethod: 'none', grantTypes: ['authorization_code', 'refresh_token'] });
    const verifier = 'synthetic-native-mcp-code-verifier-01234567890123456789';
    const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
    const challenge = btoa(String.fromCharCode(...bytes)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const approved = await helper.completeAuthorization({
      request: { responseType: 'code', clientId: client.clientId, redirectUri: redirect, scope: ['bee_read'], state: 'synthetic', codeChallenge: challenge, codeChallengeMethod: 'S256', resource: origin + '/mcp', issuer: origin },
      userId: record.email, metadata: {}, scope: ['bee_read'],
      props: { login: record.email, beeToken: scenario.auth === 'missing-bee' ? '' : 'synthetic-not-real', admissionEpoch: 0 },
    });
    const code = new URL(approved.redirectTo).searchParams.get('code')!;
    const tokenResponse = await staging.fetch(new Request(origin + '/token', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', client_id: client.clientId, code, redirect_uri: redirect, code_verifier: verifier, resource: origin + '/mcp' }),
    }), env, ctx);
    if (tokenResponse.status !== 200) return Response.json({ setupFailure: tokenResponse.status });
    const token = await tokenResponse.json() as any;
    if (scenario.policy !== 'absent') {
      env.SELF_SERVICE_ENABLED = 'true';
      env.SELF_SERVICE_READ_LIMIT = scenario.policy === 'invalid' ? 'invalid' : '5';
      env.SELF_SERVICE_POLICY_VERSION = 'synthetic-only';
    }
    if (scenario.selfHost) { env.SIGNUP_ENABLED = 'false'; delete env.BEE_ENVIRONMENT; }
    if (scenario.auth === 'denied') record.status = 'denied';
    if (scenario.auth === 'stale') record.epoch = 1;
    const results = [];
    for (const [method, params] of [
      ['initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'synthetic', version: '1' } }],
      ['notifications/initialized', {}], ['ping', {}], ['tools/list', {}],
      ['tools/call', { name: 'bee_docs', arguments: {} }],
      ['tools/call', { name: 'whoami', arguments: {} }],
      ['tools/call', { name: 'bee_read', arguments: { path: '/v1/conversations' } }],
    ] as const) {
      const notification = method === 'notifications/initialized';
      const headers: Record<string, string> = { Accept: 'application/json, text/event-stream', 'Content-Type': 'application/json', 'MCP-Protocol-Version': '2025-03-26' };
      if (scenario.auth !== 'missing') headers.Authorization = 'Bearer ' + (scenario.auth === 'invalid' ? 'synthetic-invalid' : token.access_token);
      const response = await entry.fetch(new Request(origin + '/mcp', {
        method: 'POST', headers, body: JSON.stringify({ jsonrpc: '2.0', ...(notification ? {} : { id: 1 }), method, params }),
      }), env, ctx);
      const body = await response.text();
      const data = body.split('\n').find(line => line.startsWith('data: '));
      const parsed = data ? JSON.parse(data.slice(6)) : undefined;
      const name = method === 'tools/call' ? (params as any).name : method;
      results.push({ name, status: response.status, isError: parsed?.result?.isError === true,
        protocol: parsed?.result?.protocolVersion,
        tools: parsed?.result?.tools?.map((tool: any) => tool.name),
        docs: name === 'bee_docs' && parsed?.result?.content?.[0]?.text?.includes('Bee API Usage'),
        paused: parsed?.result?.content?.[0]?.text === 'The bounded Bee runtime is paused.',
      });
    }
    // Never return grants, bearer tokens, request headers or raw response bodies.
    return Response.json({ results, runtimeChecks, bridgeCalls });
    } catch (error) { return Response.json({ fixtureError: error instanceof Error ? error.message : 'fixture failed' }); }
  },
};
