// Main deploys only the existing isolated Worker. Credentials stay in CI env.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const esbuild = require('esbuild');
const account = 'b03e6ea242724c05eb97eb732cceb21d';
const worker = 'bee-validation-20260909';
const workerId = '9b7d9c86f72e4af38303e3f9e63ee3c9';
const root = path.resolve(__dirname, '..');
const assert = (ok, message) => { if (!ok) throw Error(message); };
const ordered = x => Array.isArray(x) ? x.map(ordered) : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map(k => [k, ordered(x[k])])) : x;
const canon = x => JSON.stringify(ordered(x));
const bindings = bs => canon([...bs].map(b => b.type === 'secret_text' ? {name:b.name,type:b.type} : b).sort((a,b) => a.name.localeCompare(b.name)));
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
let phase='build', candidate=null;
async function api(method, route, body) {
  const response = await fetch('https://api.cloudflare.com/client/v4/accounts/' + account + route, {
    method, redirect:'error', headers:{Authorization:'Bearer ' + process.env.CLOUDFLARE_API_TOKEN,...(body ? {'Content-Type':'application/json'} : {})}, body:body ? JSON.stringify(body) : undefined
  });
  const result = await response.json();
  assert(response.ok && result.success, 'Cloudflare ' + method + ' HTTP ' + response.status);
  return result.result;
}
async function main() {
  assert(process.env.CLOUDFLARE_API_TOKEN, 'Missing CI Cloudflare token');
  assert(!process.env.CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID===account, 'Account mismatch');
  // Cloudflare Builds exposes this branch variable. Fail closed elsewhere.
  assert(process.env.WORKERS_CI_BRANCH==='main', 'Only main may deploy staging');
  const build = await esbuild.build({absWorkingDir:root,entryPoints:['src/staging.ts'],bundle:true,format:'esm',platform:'neutral',target:'es2022',conditions:['workerd','worker','browser'],mainFields:['module','main'],external:['cloudflare:*','node:*'],write:false,legalComments:'none',plugins:[{name:'node-path-static-import',setup(b){b.onResolve({filter:/^path$/},()=>({path:'path',namespace:'builtin-shim'}));b.onLoad({filter:/.*/,namespace:'builtin-shim'},()=>({contents:"export * from 'node:path'; import path from 'node:path'; export default path;",loader:'js'}));}}]});
  const module = build.outputFiles[0].contents, hash=digest(module);
  phase='preflight';
  const active = await api('GET','/workers/scripts/'+worker+'/deployments');
  assert(active.deployments[0].versions.length===1 && active.deployments[0].versions[0].percentage===100,'Split deployment');
  const oldId = active.deployments[0].versions[0].version_id;
  const old = await api('GET','/workers/workers/'+workerId+'/versions/'+oldId+'?include=modules');
  assert(old.modules.length===1,'Unexpected module shape');
  assert(old.bindings.find(b=>b.name==='OAUTH_KV')?.namespace_id==='d57ff6004e48496893132f343a8f4a81','KV mismatch');
  assert(old.bindings.find(b=>b.name==='BEE_BRIDGE')?.namespace_id==='5b99701b01df4b2b886be69a0202a0e9','DO mismatch');
  for(const name of ['CONSENT_SIGNING_SECRET','STAGING_OWNER_EMAIL']) assert(old.bindings.find(b=>b.name===name)?.type==='secret_text','Required secret absent');
  const settings=await api('GET','/workers/scripts/'+worker+'/settings');
  assert(bindings(settings.bindings)===bindings(old.bindings),'Settings drift');
  const owner=await api('GET','/workers/workers/'+workerId),ingress=await api('GET','/workers/scripts/'+worker+'/subdomain');
  assert(owner.observability?.enabled===false&&owner.observability?.logs?.enabled===false&&owner.observability?.traces?.enabled===false&&owner.logpush===false,'Logging boundary');
  assert(ingress.enabled===true&&ingress.previews_enabled===false,'Ingress boundary');
  const container=await api('GET','/containers/applications/a0362707-1337-4517-9f84-49b53ecfdfa9');
  assert(container.max_instances===1&&container.configuration?.vcpu===0.25&&container.configuration?.memory_mib===1024&&container.configuration?.disk?.size_mb===4000,'Container allocation');
  assert(container.configuration?.observability?.logs?.enabled===false&&container.configuration?.network?.mode==='private','Container privacy');
  assert(container.configuration?.image?.endsWith('@sha256:5f732c594b2c5dbb1b06de2ff2ec81bfb45ca075eb6dcb9f71ea6c839ac09306'),'Container image');
  const production=canon(await api('GET','/workers/scripts/bee-ai-auth-mcp/deployments'));
  const fields=['assets','cache_options','compatibility_date','compatibility_flags','containers','limits','main_module','package_dependencies','placement','usage_model'];
  const body=Object.fromEntries(fields.filter(k=>old[k]!==undefined).map(k=>[k,old[k]]));
  body.exports={...(old.exports||{}),BeeBridge:{type:'durable-object',storage:'sqlite',container:'BeeBridge'}};
  body.containers=body.containers.map(c=>c.class_name==='BeeBridge'?{...c,name:'BeeBridge'}:c);
  body.modules=[{...old.modules[0],content_base64:Buffer.from(module).toString('base64')}];
  body.bindings=old.bindings.map(b=>b.type==='secret_text'?{type:'inherit',name:b.name,version_id:oldId}:b);
  body.annotations={'workers/message':'Reviewed main staging source; preserve credentials, storage, Container and runtime deadline.'};
  phase='upload';
  candidate=(await api('POST','/workers/workers/'+workerId+'/versions?deploy=false',body)).id;
  const uploaded=await api('GET','/workers/workers/'+workerId+'/versions/'+candidate+'?include=modules');
  assert(uploaded.modules.length===1&&digest(Buffer.from(uploaded.modules[0].content_base64,'base64'))===hash,'Uploaded source');
  assert(bindings(uploaded.bindings)===bindings(old.bindings),'Uploaded bindings');
  for(const k of fields) if(body[k]!==undefined) assert(canon(uploaded[k])===canon(body[k]),'Uploaded metadata '+k);
  assert(canon(uploaded.exports)===canon(body.exports),'Uploaded exports');
  assert(canon(await api('GET','/workers/scripts/'+worker+'/deployments'))===canon(active),'Concurrent deployment');
  phase='deploy';
  await api('POST','/workers/scripts/'+worker+'/deployments',{strategy:'percentage',versions:[{version_id:candidate,percentage:100}],annotations:body.annotations});
  phase='readback';
  const after=await api('GET','/workers/scripts/'+worker+'/deployments');
  assert(after.deployments[0].versions.length===1&&after.deployments[0].versions[0].version_id===candidate&&after.deployments[0].versions[0].percentage===100,'Active version');
  assert(bindings((await api('GET','/workers/scripts/'+worker+'/settings')).bindings)===bindings(old.bindings),'Effective bindings');
  const deployed=await api('GET','/workers/workers/'+workerId+'/versions/'+candidate);
  assert(deployed.migration_tag===old.migration_tag,'Migration linkage');
  const finalOwner=await api('GET','/workers/workers/'+workerId);
  assert(canon(finalOwner.observability)===canon(owner.observability)&&finalOwner.logpush===owner.logpush,'Logging changed');
  assert(canon(await api('GET','/workers/scripts/'+worker+'/subdomain'))===canon(ingress),'Ingress changed');
  const finalContainer=await api('GET','/containers/applications/a0362707-1337-4517-9f84-49b53ecfdfa9');
  assert(finalContainer.max_instances===container.max_instances&&canon(finalContainer.configuration)===canon(container.configuration),'Container changed');
  assert(canon(await api('GET','/workers/scripts/bee-ai-auth-mcp/deployments'))===production,'Production changed');
  const receipt={accepted:true,observed:new Date().toISOString(),version:candidate,deployment:after.deployments[0].id,module_sha256:hash,previous_version:oldId,bindings_and_runtime_deadline_preserved:true,secrets_inherited:true,container_preserved:true,production_unchanged:true};
  console.log(JSON.stringify(receipt));
}
main().catch(error=>{console.error(JSON.stringify({accepted:false,phase,candidate,error:error.message}));process.exitCode=1;});
