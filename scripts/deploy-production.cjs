// Invoked only by the reviewed production Git Build. Never a seat deploy.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const ROOT = path.resolve(__dirname, '..');
const ACCOUNT = 'b03e6ea242724c05eb97eb732cceb21d';
const WORKER = 'bee-ai-auth-mcp';
const TAG = '27b750389ea04ed1af1a6c50dc0e5e37';
const CONTAINER = 'a0318e64-bcdf-4095-bbcc-3400033b3290';
const IMAGE = 'registry.cloudflare.com/' + ACCOUNT + '/bee-validation-20260909-455501a57e820ab6c3eb927b699d02cb@sha256:5f732c594b2c5dbb1b06de2ff2ec81bfb45ca075eb6dcb9f71ea6c839ac09306';
const FIELDS = ['cache_options','compatibility_date','compatibility_flags','containers','limits','main_module','package_dependencies','placement','usage_model'];
class Refusal extends Error { constructor(code) { super(code); this.code = code; } }
const check = (ok, code) => { if (!ok) throw new Refusal(code); };
const ordered = x => Array.isArray(x) ? x.map(ordered) : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map(k => [k,ordered(x[k])])) : x;
const canon = x => JSON.stringify(ordered(x));
const digest = x => crypto.createHash('sha256').update(x).digest('hex');
const bindingShape = bs => canon(bs.map(b => b.type === 'secret_text' ? {name:b.name,type:b.type} : b).sort((a,b) => a.name.localeCompare(b.name)));
const script = '/workers/scripts/' + WORKER;
const version = id => '/workers/workers/' + TAG + '/versions/' + id + '?include=modules';
const activeId = d => { check(d?.deployments?.[0]?.versions?.length === 1 && d.deployments[0].versions[0].percentage === 100,'split-deployment'); return d.deployments[0].versions[0].version_id; };
function validateManifest(m, env, stamp) {
  check(env.WORKERS_CI_BRANCH === 'production','not-production-build');
  check(/^[a-f0-9]{40}$/.test(env.WORKERS_CI_COMMIT_SHA || '') && stamp === env.WORKERS_CI_COMMIT_SHA,'source-stamp');
  check(env.CLOUDFLARE_API_TOKEN && (!env.CLOUDFLARE_ACCOUNT_ID || env.CLOUDFLARE_ACCOUNT_ID === ACCOUNT),'ci-credentials');
  check(m?.schemaVersion === 1 && m.accepted === true && /^https:\/\/github.com\/klappy\/kitchen\//.test(m.acceptanceReceipt || ''),'unaccepted-prerequisites');
  for (const key of ['configurationVersion','previousDeployment','emailAccessAppId','adminAccessAppId','emailPolicyId','adminPolicyId','ownerReferencePolicyId']) check(/^[a-f0-9-]{36}$/.test(m[key] || ''),'missing-prerequisite');
  check(/^[a-f0-9]{40}$/.test(m.reviewedMain || ''),'reviewed-main');
  check(m.ownerPolicyMatched === true,'owner-policy-acceptance');
  check(m.emailAccessAppId !== m.adminAccessAppId,'access-separation');
  check(m.accessTeamDomain === 'klappy.cloudflareaccess.com' && /^[a-f0-9]{64}$/.test(m.accessAud || '') && /^[a-f0-9]{64}$/.test(m.adminAccessAud || '') && m.accessAud !== m.adminAccessAud,'access-audiences');
  check(Number.isSafeInteger(m.monthlyLimit) && m.monthlyLimit > 0 && typeof m.policyVersion === 'string' && /^[a-zA-Z0-9._-]{1,80}$/.test(m.policyVersion),'monthly-policy');
}
function validateVersion(v, m) {
  check(v.modules?.length === 1 && v.migration_tag === 'v1','version-shape');
  const byName = Object.fromEntries(v.bindings.map(b => [b.name,b]));
  check(byName.OAUTH_KV?.namespace_id === '8f260f3c8ab6476dbea2b17926bf38bf' && byName.BEE_BRIDGE?.namespace_id === '22228994536c4bb3808aa281c53e9727','storage-linkage');
  for (const key of ['GITHUB_CLIENT_ID','GITHUB_CLIENT_SECRET','CONSENT_SIGNING_SECRET','ADMIN_OWNER_EMAIL']) check(byName[key]?.type === 'secret_text','required-secret');
  const required = {ACCESS_TEAM_DOMAIN:m.accessTeamDomain,ACCESS_AUD:m.accessAud,ADMIN_ACCESS_AUD:m.adminAccessAud,SIGNUP_ENABLED:'true',SELF_SERVICE_ENABLED:'true',SELF_SERVICE_READ_LIMIT:String(m.monthlyLimit),SELF_SERVICE_POLICY_VERSION:m.policyVersion};
  for (const [key,value] of Object.entries(required)) check(byName[key]?.type === 'plain_text' && byName[key]?.text === value,'hosted-policy-binding');
  check(!v.bindings.some(b => /^(STAGING_|VALIDATION_|OWNER_USAGE_)/.test(b.name)),'staging-binding-in-production');
}
function validatePrivacy(owner, ingress, container) {
  check(owner.observability?.enabled === false && owner.observability?.logs?.enabled === false && owner.observability?.traces?.enabled === false && owner.logpush === false,'worker-logging');
  check(ingress.enabled === true && ingress.previews_enabled === false,'preview-ingress');
  const c = container.configuration;
  check(container.max_instances === 1 && c?.vcpu === 0.25 && c?.memory_mib === 1024 && c?.disk?.size_mb === 4000,'container-allocation');
  check(c?.image === IMAGE && c?.network?.mode === 'private' && c?.observability?.logs?.enabled === false,'container-privacy-image');
}
function candidateBody(old, bytes) {
  const body = Object.fromEntries(FIELDS.filter(k => old[k] !== undefined).map(k => [k,structuredClone(old[k])]));
  // The accepted Worker-owned asset contract intentionally detaches the old
  // external asset router. Configuration-only uploads do not preserve it.
  check(Array.isArray(body.containers),'container-shape');
  check(!old.bindings.some(b => b.type === 'assets' || b.name === 'ASSETS'),'unexpected-asset-binding');
  body.exports = {...old.exports,BeeBridge:{type:'durable-object',storage:'sqlite',container:'BeeBridge'}};
  body.containers = body.containers.map(c => c.class_name === 'BeeBridge' ? {...c,name:'BeeBridge'} : c);
  body.modules = [{...old.modules[0],content_base64:Buffer.from(bytes).toString('base64')}];
  body.bindings = old.bindings.map(b => b.type === 'secret_text' ? {type:'inherit',name:b.name,version_id:old.id} : b);
  body.annotations = {'workers/message':'Reviewed production Git source; preserve grants, storage and private runtime.'};
  return body;
}
function verifyCandidate(v, body, hash, expectedBindings) {
  check(v.assets === undefined && body.assets === undefined,'external-assets-present');
  // Cloudflare omits migration_tag on undeployed versions (PR63 provider receipt).
  // Absence is accepted only with the complete unchanged binding/export/container
  // comparisons below and no migration payload. A contrary tag always refuses.
  check(v.migration_tag === undefined || v.migration_tag === 'v1','candidate-migration');
  check(body.migrations === undefined && v.migrations === undefined,'candidate-migration-payload');
  check(body.exports?.BeeBridge?.type === 'durable-object' && body.exports.BeeBridge.storage === 'sqlite' && body.exports.BeeBridge.container === 'BeeBridge','candidate-lineage');
  check(Array.isArray(body.containers) && body.containers.some(c => c.class_name === 'BeeBridge' && c.name === 'BeeBridge'),'candidate-container-linkage');
  check(v.modules?.length === 1 && digest(Buffer.from(v.modules[0].content_base64,'base64')) === hash,'candidate-source');
  check(bindingShape(v.bindings) === expectedBindings,'candidate-bindings');
  for (const key of FIELDS) check(canon(v[key]) === canon(body[key]),'candidate-metadata');
  check(canon(v.exports) === canon(body.exports),'candidate-exports');
}
async function run({env, manifest, stamp, bundle, api, publicCheck}) {
  let phase = 'preflight', candidate = null, deployed = false, deploymentAttempted = false;
  try {
    validateManifest(manifest, env, stamp);
    const bytes = await bundle(), hash = digest(bytes);
    check(Buffer.from(bytes).includes(Buffer.from(stamp)),'bundled-stamp');
    const active = await api('GET',script + '/deployments');
    const oldId = activeId(active);
    check(oldId === manifest.configurationVersion && active.deployments[0].id === manifest.previousDeployment,'accepted-configuration-drift');
    const old = await api('GET',version(oldId)); old.id = oldId;
    validateVersion(old,manifest);
    // Legacy settings may project the newest undeployed candidate. Active
    // bindings come exclusively from deployments -> exact immutable version.
    const settings = await api('GET',script + '/settings');
    const legacySettingsMatchActive = bindingShape(settings.bindings) === bindingShape(old.bindings);
    const owner = await api('GET','/workers/workers/' + TAG);
    const ingress = await api('GET',script + '/subdomain');
    const container = await api('GET','/containers/applications/' + CONTAINER);
    validatePrivacy(owner,ingress,container);
    const accessSnapshots = [];
    const ownerReferenceId = '8fc54e03-24c8-4c02-9376-7c639a3ca94e';
    const referencePolicies = await api('GET','/access/apps/' + ownerReferenceId + '/policies');
    check(Array.isArray(referencePolicies) && referencePolicies.length === 1,'owner-reference-count');
    const rp = referencePolicies[0];
    check(rp.id === manifest.ownerReferencePolicyId && rp.decision === 'allow' && rp.require?.length === 0 && rp.exclude?.length === 0 && rp.include?.length === 1 && Object.keys(rp.include[0]).length === 1 && typeof rp.include[0].email?.email === 'string' && rp.include[0].email.email.length > 0,'owner-reference-shape');
    const otpId = 'c47d1caf-ecad-4abc-8c66-17c96c9ff5fd';
    for (const [id,aud,policyId,isAdmin] of [[manifest.emailAccessAppId,manifest.accessAud,manifest.emailPolicyId,false],[manifest.adminAccessAppId,manifest.adminAccessAud,manifest.adminPolicyId,true]]) {
      const app = await api('GET','/access/apps/' + id);
      const paths = isAdmin ? ['/admin','/admin/*'] : ['/signup','/signup/*','/authorize/email','/authorize/email/*'];
      const targets = ['bee.klappy.dev','bee-ai-auth-mcp.klappy.workers.dev'].flatMap(host => paths.map(p => ({type:'public',uri:host+p})));
      check(app.type === 'self_hosted' && app.aud === aud && canon(app.allowed_idps) === canon([otpId]),'access-resource-drift');
      check(canon([...(app.destinations || [])].sort((a,b)=>a.uri.localeCompare(b.uri))) === canon(targets.sort((a,b)=>a.uri.localeCompare(b.uri))),'access-target-drift');
      const policies = await api('GET','/access/apps/' + id + '/policies');
      check(Array.isArray(policies) && policies.length === 1,'access-policy-count');
      const p = policies[0];
      check(p.id === policyId && p.decision === 'allow' && p.require?.length === 0 && p.exclude?.length === 0 && p.include?.length === 1,'access-policy-shape');
      if (isAdmin) {
        check(Object.keys(p.include[0]).length === 1 && typeof p.include[0].email?.email === 'string' && p.include[0].email.email.length > 0,'admin-policy-shape');
        check(p.include[0].email.email.trim().toLowerCase() === rp.include[0].email.email.trim().toLowerCase(),'owner-policy-mismatch');
      }
      else check(canon(p.include) === canon([{everyone:{}}]),'email-policy-shape');
      // Private policy content stays solely in this process. No hash or identity in receipts.
      accessSnapshots.push({id,app,policies});
    }
    check((await api('GET','/access/identity_providers/' + otpId)).type === 'onetimepin','otp-provider');
    const domain = await api('GET','/workers/domains');
    check(Array.isArray(domain) && domain.some(d => d.id === 'd1949a5b447e9deff5652e7be227fd10d787957a' && d.hostname === 'bee.klappy.dev' && d.service === WORKER),'custom-domain');
    const staging = await api('GET','/workers/scripts/bee-validation-20260909/deployments');
    const body = candidateBody(old,bytes), expectedBindings = bindingShape(old.bindings);
    phase = 'upload';
    candidate = (await api('POST','/workers/workers/' + TAG + '/versions?deploy=false',body)).id;
    check(/^[a-f0-9-]{36}$/.test(candidate || ''),'candidate-id');
    phase = 'candidate-verification';
    verifyCandidate(await api('GET',version(candidate)),body,hash,expectedBindings);
    check(canon(await api('GET',script + '/deployments')) === canon(active),'upload-deployment-side-effect');
    const stillActive = await api('GET',version(oldId));
    check(canon(stillActive) === canon(old),'active-version-drift');
    for (const snapshot of accessSnapshots) {
      check(canon(await api('GET','/access/apps/' + snapshot.id)) === canon(snapshot.app),'access-app-drift');
      check(canon(await api('GET','/access/apps/' + snapshot.id + '/policies')) === canon(snapshot.policies),'access-policy-drift');
    }
    check(canon(await api('GET','/access/apps/' + ownerReferenceId + '/policies')) === canon(referencePolicies),'owner-reference-drift');
    phase = 'deploy';
    deploymentAttempted = true; deployed = 'unknown';
    await api('POST',script + '/deployments',{strategy:'percentage',versions:[{version_id:candidate,percentage:100}],annotations:body.annotations});
    deployed = true; phase = 'readback';
    const after = await api('GET',script + '/deployments');
    check(activeId(after) === candidate,'active-version');
    const actual = await api('GET',version(candidate));
    verifyCandidate(actual,body,hash,expectedBindings);
    check(actual.migration_tag === 'v1','migration-linkage');
    // actual is the version selected by the observed active deployment.
    check(bindingShape(actual.bindings) === expectedBindings,'effective-bindings');
    const finalOwner = await api('GET','/workers/workers/' + TAG);
    check(canon(finalOwner.observability) === canon(owner.observability) && finalOwner.logpush === owner.logpush,'logging-drift');
    check(canon(await api('GET',script + '/subdomain')) === canon(ingress),'ingress-drift');
    const finalContainer = await api('GET','/containers/applications/' + CONTAINER);
    check(finalContainer.max_instances === container.max_instances && canon(finalContainer.configuration) === canon(container.configuration),'container-drift');
    const instances = await api('GET','/containers/applications/' + CONTAINER + '/instances');
    check(Array.isArray(instances?.instances),'instance-response-shape');
    for (const instance of instances.instances) check(instance.image === IMAGE,'instance-image');
    check(canon(await api('GET','/workers/domains')) === canon(domain),'domain-drift');
    check(canon(await api('GET','/workers/scripts/bee-validation-20260909/deployments')) === canon(staging),'staging-drift');
    for (const snapshot of accessSnapshots) {
      check(canon(await api('GET','/access/apps/' + snapshot.id)) === canon(snapshot.app),'access-app-drift');
      check(canon(await api('GET','/access/apps/' + snapshot.id + '/policies')) === canon(snapshot.policies),'access-policy-drift');
    }
    await publicCheck(stamp);
    return {accepted:true,observed:new Date().toISOString(),source:stamp,version:candidate,deployment:after.deployments[0].id,module_sha256:hash,previous_version:oldId,secrets_inherited:true,storage_preserved:true,staging_unchanged:true,external_assets_absent:true,legacy_settings_matched_active_at_start:legacySettingsMatchActive};
  } catch (error) {
    if (deploymentAttempted && deployed !== true) {
      try { deployed = activeId(await api('GET',script + '/deployments')) === candidate; }
      catch { deployed = 'unknown'; }
    }
    // Never render a provider body, exception message, binding value or private identity.
    return {accepted:false,phase,candidate,source_deployed:deployed,deployment_attempted:deploymentAttempted,error:error instanceof Refusal ? error.code : 'operation-failed'};
  }
}
async function publicCheck(stamp, expectedAssets) {
  const get = async (pathname, method='GET') => fetch('https://bee.klappy.dev' + pathname,{method,redirect:'manual'});
  const v = await get('/version'); check(v.ok && (await v.text()).includes(stamp),'public-version');
  const home = await get('/'); check(home.ok && home.headers.get('content-type')?.includes('text/html'),'public-homepage');
  check((await home.text()).replace(/<[^>]*>/g,'').includes('Your Bee, in the AI you already use.'),'public-copy');
  for (const [assetPath,asset] of Object.entries(expectedAssets)) {
    const endpoint = assetPath === '/index.html' ? '/' : assetPath.endsWith('.html') ? assetPath.slice(0,-5) : assetPath;
    const r = await get(endpoint);
    check(r.ok && r.headers.get('content-type') === asset.mime && digest(Buffer.from(await r.arrayBuffer())) === asset.sha256,'public-asset-bytes');
  }
  const head = await get('/','HEAD'); check(head.ok && (await head.text()) === '','public-head');
  for (const p of ['/.well-known/oauth-authorization-server','/.well-known/oauth-protected-resource']) {
    const r = await get(p); check(r.ok && r.headers.get('content-type')?.includes('application/json'),'public-oauth-metadata');
    const json = await r.json(); check(json && typeof json === 'object','public-oauth-json');
  }
  const mcp = await get('/mcp'); check(mcp.status === 401 && /Bearer/i.test(mcp.headers.get('www-authenticate') || ''),'public-mcp-challenge');
}

function releaseHtml(html) {
  const notice = '<aside class="pair-help" aria-label="Draft status"><strong>Homepage draft — review only.</strong> This describes the intended launch experience. Immediate free access and paid upgrades are not enabled yet.</aside>';
  check(typeof html === 'string' && html.split(notice).length === 2,'approved-notice-shape');
  return html.replace(notice,'');
}
async function releaseAssetSource(root) {
  // Read the canonical approved module, never maintain a second HTML literal.
  const built = await require('esbuild').build({absWorkingDir:root,stdin:{contents:"export { HOSTED_HOMEPAGE_HTML } from './src/hosted-homepage'; export { assets } from './src/embedded-asset-data';",resolveDir:root},bundle:true,format:'esm',platform:'neutral',write:false,logLevel:'silent'});
  const data = await import('data:text/javascript;base64,' + Buffer.from(built.outputFiles[0].contents).toString('base64'));
  const assets = structuredClone(data.assets);
  // Preserve known static path/MIME contract; refresh exact public bytes. Only index uses approved copy.
  for (const [key, previous] of Object.entries(assets)) {
    check(/^\/[a-zA-Z0-9._-]+$/.test(key),'asset-path');
    const bytes = key === '/index.html' ? Buffer.from(releaseHtml(data.HOSTED_HOMEPAGE_HTML)) : fs.readFileSync(path.join(root,'public',key.slice(1)));
    assets[key] = {...previous,base64:bytes.toString('base64'),size:bytes.length,sha256:digest(bytes)};
  }
  check(assets['/index.html'] && assets['/style.css'],'required-assets');
  return 'export const assets = ' + JSON.stringify(assets) + ';';
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT,'deploy/production-prerequisites.json'),'utf8'));
  const stamp = fs.readFileSync(path.join(ROOT,'src/version.ts'),'utf8').match(/COMMIT_SHA = "([a-f0-9]{40})"/)?.[1];
  validateManifest(manifest,process.env,stamp);
  const {execFileSync} = require('node:child_process');
  // Missing shallow-history ancestry fails closed; release preparation must supply history.
  execFileSync('git',['merge-base','--is-ancestor',manifest.reviewedMain,stamp],{cwd:ROOT,stdio:'ignore'});
  const api = async (method, route, body) => {
    const r = await fetch('https://api.cloudflare.com/client/v4/accounts/' + ACCOUNT + route,{method,redirect:'error',headers:{Authorization:'Bearer ' + process.env.CLOUDFLARE_API_TOKEN,...(body ? {'Content-Type':'application/json'} : {})},body:body ? JSON.stringify(body) : undefined});
    check(r.ok,'provider-http-' + r.status);
    const json = await r.json(); check(json.success === true,'provider-rejected'); return json.result;
  };
  let expectedAssets;
  const bundle = async () => {
    const assetSource = await releaseAssetSource(ROOT);
    expectedAssets = JSON.parse(assetSource.slice("export const assets = ".length,-1));
    const result = await require('esbuild').build({absWorkingDir:ROOT,entryPoints:['src/hosted.ts'],bundle:true,format:'esm',platform:'neutral',target:'es2022',conditions:['workerd','worker','browser'],mainFields:['module','main'],external:['cloudflare:*','node:*'],write:false,legalComments:'none',logLevel:'silent',plugins:[{name:'approved-production-assets',setup(b){b.onLoad({filter:/[/\\]embedded-asset-data\.ts$/},()=>({contents:assetSource,loader:'js'}));}},{name:'node-path-static-import',setup(b){b.onResolve({filter:/^path$/},()=>({path:'path',namespace:'builtin-shim'}));b.onLoad({filter:/.*/,namespace:'builtin-shim'},()=>({contents:"export * from 'node:path'; import path from 'node:path'; export default path;",loader:'js'}));}}]});
    return result.outputFiles[0].contents;
  };
  const receipt = await run({env:process.env,manifest,stamp,bundle,api,publicCheck:(source)=>publicCheck(source,expectedAssets)});
  console.log(JSON.stringify(receipt)); if (!receipt.accepted) process.exitCode = 1;
}
module.exports = {releaseHtml,releaseAssetSource,run,validateManifest,validateVersion,validatePrivacy,candidateBody,verifyCandidate,canon,digest,bindingShape,IMAGE};
if (require.main === module) main().catch(() => {console.error(JSON.stringify({accepted:false,phase:'initialization',candidate:null,source_deployed:false,error:'configuration-unavailable'}));process.exitCode=1;});
