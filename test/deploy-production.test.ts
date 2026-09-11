import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
const {run, releaseHtml, IMAGE, digest, candidateBody, verifyCandidate, bindingShape} = createRequire(import.meta.url)('../scripts/deploy-production.cjs');
const id = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
const sha = 'a'.repeat(40);
const manifest = {schemaVersion:1,accepted:true,reviewedMain:sha,emailPolicyId:id(11),adminPolicyId:id(12),ownerPolicyMatched:true,ownerReferencePolicyId:id(13),acceptanceReceipt:'https://github.com/klappy/kitchen/blob/main/receipt.md',configurationVersion:id(1),previousDeployment:id(2),emailAccessAppId:id(3),adminAccessAppId:id(4),accessTeamDomain:'https://klappy.cloudflareaccess.com',accessAud:'a'.repeat(64),adminAccessAud:'b'.repeat(64),monthlyLimit:500,policyVersion:'monthly-test'};
const bindings = [
  {name:'OAUTH_KV',type:'kv_namespace',namespace_id:'8f260f3c8ab6476dbea2b17926bf38bf'},
  {name:'BEE_BRIDGE',type:'durable_object_namespace',namespace_id:'22228994536c4bb3808aa281c53e9727'},
  ...['GITHUB_CLIENT_ID','GITHUB_CLIENT_SECRET','CONSENT_SIGNING_SECRET','ADMIN_OWNER_EMAIL'].map(name => ({name,type:'secret_text',text:'NEVER_PRINT_THIS'})),
  ...Object.entries({ACCESS_TEAM_DOMAIN:manifest.accessTeamDomain,ACCESS_AUD:manifest.accessAud,ADMIN_ACCESS_AUD:manifest.adminAccessAud,SIGNUP_ENABLED:'true',SELF_SERVICE_ENABLED:'true',SELF_SERVICE_READ_LIMIT:'500',SELF_SERVICE_POLICY_VERSION:'monthly-test'}).map(([name,text]) => ({name,type:'plain_text',text})),
];
function fixture() {
  let deployed = false; let uploaded: any;
  const calls: {method:string,route:string,body:any}[] = [];
  const old = {id:id(1),migration_tag:'v1',modules:[{name:'worker.js',content_type:'application/javascript+module',content_base64:'b2xk'}],bindings,assets:{jwt:'NEVER_PRINT_ASSET_TOKEN',config:{html_handling:'auto-trailing-slash',not_found_handling:'none'}},containers:[{class_name:'BeeBridge',application_id:id(8)}],exports:{BeeBridge:{type:'durable-object',storage:'sqlite',container:'BeeBridge'}},compatibility_date:'2026-01-01',main_module:'worker.js',limits:{cpu_ms:30000}};
  const owner = {observability:{enabled:false,logs:{enabled:false,persist:false},traces:{enabled:false}},logpush:false};
  const container = {max_instances:1,configuration:{vcpu:0.25,memory_mib:1024,disk:{size_mb:4000},image:IMAGE,network:{mode:'private'},observability:{logs:{enabled:false}},environment_variables:{PRESERVE:'private'}}};
  const api = async (method:string,route:string,body?:any) => {
    calls.push({method,route,body});
    if (method === 'POST' && route.includes('deploy=false')) {uploaded = {...structuredClone(body),id:id(9),migration_tag:'v1',bindings};return {id:id(9)};}
    if (method === 'POST') {deployed = true;return {};}
    if (route.includes('/versions/')) return structuredClone(route.includes(id(9)) ? uploaded : old);
    if (route.includes('bee-validation-20260909')) return {deployments:[{id:id(7),versions:[{version_id:id(6),percentage:100}]}]};
    if (route.endsWith('/deployments')) return {deployments:[{id:deployed ? id(10):id(2),versions:[{version_id:deployed ? id(9):id(1),percentage:100}]}]};
    if (route.endsWith('/settings')) return {bindings};
    if (route.endsWith('/subdomain')) return {enabled:true,previews_enabled:false};
    if (route.includes('/access/identity_providers/')) return {type:'onetimepin'};
    if (route === '/access/apps/8fc54e03-24c8-4c02-9376-7c639a3ca94e/policies') return [{id:id(13),decision:'allow',include:[{email:{email:'PRIVATE_TEST_ONLY'}}],require:[],exclude:[]}];
    if (route.includes('/access/apps/')) {
      const admin=route.includes(id(4));
      if(route.endsWith('/policies')) return [{id:admin?id(12):id(11),decision:'allow',include:admin?[{email:{email:'PRIVATE_TEST_ONLY'}}]:[{everyone:{}}],require:[],exclude:[]}];
      const paths=admin?['/admin','/admin/*']:['/signup','/signup/*','/authorize/email','/authorize/email/*'];
      return {type:'self_hosted',aud:admin?manifest.adminAccessAud:manifest.accessAud,allowed_idps:['c47d1caf-ecad-4abc-8c66-17c96c9ff5fd'],destinations:['bee.klappy.dev','bee-ai-auth-mcp.klappy.workers.dev'].flatMap(h=>paths.map(p=>({type:'public',uri:h+p})))};
    }
    if (route === '/workers/domains') return [{id:'d1949a5b447e9deff5652e7be227fd10d787957a',hostname:'bee.klappy.dev',service:'bee-ai-auth-mcp'}];
    if (route.endsWith('/instances')) return {instances:[]};
    if (route.includes('/containers/')) return container;
    return owner;
  };
  const options = {env:{WORKERS_CI_BRANCH:'production',WORKERS_CI_COMMIT_SHA:sha,CLOUDFLARE_API_TOKEN:'NEVER_PRINT_CREDENTIAL'},manifest:structuredClone(manifest),stamp:sha,bundle:async()=>Buffer.from('source:'+sha),api,publicCheck:async()=>{}};
  return {options,calls,old,owner,container};
}
describe('production Git Build preservation transaction',()=>{
  it('uploads without deploying, verifies, explicitly deploys, reads back',async()=>{
    const f=fixture();const receipt=await run(f.options);expect(receipt.accepted).toBe(true);
    const writes=f.calls.filter(c=>c.method==='POST');expect(writes).toHaveLength(2);expect(writes[0].route).toContain('?deploy=false');expect(writes[1].route).toMatch(/\/deployments$/);
    expect(writes[0].body.assets.config).toEqual({...f.old.assets.config,run_worker_first:true});
    expect(writes[0].body.bindings.find((b:any)=>b.name==='GITHUB_CLIENT_SECRET')).toEqual({name:'GITHUB_CLIENT_SECRET',type:'inherit',version_id:id(1)});
    expect(JSON.stringify(receipt)).not.toContain('NEVER_PRINT');
  });
  it.each([['accepted',false],['monthlyLimit',0],['monthlyLimit',-1],['monthlyLimit',1.5],['monthlyLimit',null],['policyVersion',''],['configurationVersion',null]])('refuses bad %s before provider work',async(key,value)=>{
    const f=fixture();(f.options.manifest as any)[key]=value;expect((await run(f.options)).accepted).toBe(false);expect(f.calls).toHaveLength(0);
  });
  it('refuses a local or main build before reads',async()=>{const f=fixture();f.options.env.WORKERS_CI_BRANCH='main';expect((await run(f.options)).accepted).toBe(false);expect(f.calls).toHaveLength(0);});
  it('refuses source mismatch before reads',async()=>{const f=fixture();f.options.stamp='b'.repeat(40);expect((await run(f.options)).accepted).toBe(false);expect(f.calls).toHaveLength(0);});
  it('refuses logging before upload',async()=>{const f=fixture();f.owner.observability.logs.enabled=true;expect((await run(f.options)).accepted).toBe(false);expect(f.calls.some(c=>c.method==='POST')).toBe(false);});
  it('does not leak arbitrary exception text',async()=>{const f=fixture();f.options.bundle=async()=>{throw Error('NEVER_PRINT_TOKEN_OR_PRIVATE_RESPONSE');};const r=await run(f.options);expect(r.error).toBe('operation-failed');expect(JSON.stringify(r)).not.toContain('NEVER_PRINT');});
  it('refuses candidate metadata drift without deployment',async()=>{const f=fixture();const api=f.options.api;f.options.api=async(m,r,b)=>{const v=await api(m,r,b);if(r.includes('/versions/'+id(9)))v.limits={cpu_ms:1};return v;};const result=await run(f.options);expect(result.phase).toBe('candidate-verification');expect(result.source_deployed).toBe(false);expect(f.calls.filter(c=>c.method==='POST')).toHaveLength(1);});
  it('distinguishes deployed but public readback failed',async()=>{const f=fixture();f.options.publicCheck=async()=>{throw Error('private');};const r=await run(f.options);expect(r.accepted).toBe(false);expect(r.phase).toBe('readback');expect(r.source_deployed).toBe(true);});
  it('preserves all writable metadata and rejects missing candidate fields',()=>{const f=fixture();const body=candidateBody(f.old,Buffer.from(sha));const uploaded={...body,bindings,migration_tag:'v1'};delete uploaded.limits;expect(()=>verifyCandidate(uploaded,body,digest(Buffer.from(sha)),bindingShape(bindings))).toThrow('candidate-metadata');});
});

it('removes only the exact obsolete release notice and preserves all other approved bytes',()=>{const banner='<aside class="pair-help" aria-label="Draft status"><strong>Homepage draft — review only.</strong> This describes the intended launch experience. Immediate free access and paid upgrades are not enabled yet.</aside>'; const before='<!DOCTYPE html>\n'+banner+'\nPaid signup is not open yet; exact approved remainder.';expect(releaseHtml(before)).toBe(before.replace(banner,''));expect(()=>releaseHtml('different banner')).toThrow('approved-notice-shape');expect(()=>releaseHtml(banner+banner)).toThrow('approved-notice-shape');});
it('refuses protocol interception by an Access target before upload',async()=>{const f=fixture();const api=f.options.api;f.options.api=async(m,r,b)=>{const v=await api(m,r,b);if(v.destinations)v.destinations.push({type:'public',uri:'bee.klappy.dev/mcp'});return v;};const result=await run(f.options);expect(result.error).toBe('access-target-drift');expect(f.calls.some(c=>c.method==='POST')).toBe(false);});
it('refuses broad identity provider configuration before upload',async()=>{const f=fixture();const api=f.options.api;f.options.api=async(m,r,b)=>{const v=await api(m,r,b);if(v.allowed_idps)v.allowed_idps=[];return v;};const result=await run(f.options);expect(result.error).toBe('access-resource-drift');expect(f.calls.some(c=>c.method==='POST')).toBe(false);});
it('refuses a runtime binding from staging before upload',async()=>{const f=fixture();f.old.bindings=[...f.old.bindings,{name:'VALIDATION_EXPIRES_AT',type:'plain_text',text:'expired'}] as any;const result=await run(f.options);expect(result.error).toBe('staging-binding-in-production');expect(f.calls.some(c=>c.method==='POST')).toBe(false);});

it('refuses candidate migration drift before deployment',async()=>{const f=fixture();const api=f.options.api;f.options.api=async(m,r,b)=>{const v=await api(m,r,b);if(r.includes('/versions/'+id(9)))v.migration_tag='v2';return v;};const result=await run(f.options);expect(result.error).toBe('candidate-migration');expect(f.calls.filter(c=>c.method==='POST')).toHaveLength(1);});
it('reconciles a deployment whose response was lost after effect',async()=>{const f=fixture();const api=f.options.api;f.options.api=async(m,r,b)=>{const v=await api(m,r,b);if(m==='POST'&&r.endsWith('/deployments'))throw Error('transport');return v;};const result=await run(f.options);expect(result.deployment_attempted).toBe(true);expect(result.source_deployed).toBe(true);expect(result.accepted).toBe(false);});
it('reports unknown deployment outcome when reconciliation is unavailable',async()=>{const f=fixture();const api=f.options.api;let attempted=false;f.options.api=async(m,r,b)=>{if(attempted&&r.endsWith('/deployments'))throw Error('network');if(m==='POST'&&r.endsWith('/deployments')){attempted=true;throw Error('network');}return api(m,r,b);};const result=await run(f.options);expect(result.source_deployed).toBe('unknown');expect(result.deployment_attempted).toBe(true);});
it('rejects changed production owner identity before upload without revealing it',async()=>{const f=fixture();const api=f.options.api;f.options.api=async(m,r,b)=>{const v=await api(m,r,b);if(r.includes(id(4))&&r.endsWith('/policies'))v[0].include=[{email:{email:'OTHER_PRIVATE_OWNER'}}];return v;};const result=await run(f.options);expect(result.error).toBe('owner-policy-mismatch');expect(f.calls.some(c=>c.method==='POST')).toBe(false);expect(JSON.stringify(result)).not.toContain('PRIVATE');});
