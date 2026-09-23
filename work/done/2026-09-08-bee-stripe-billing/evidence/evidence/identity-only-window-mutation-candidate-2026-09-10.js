// DRAFT: requires independent exact-code acceptance and owner/CoS applicable authority. NOT EXECUTED.
async () => {
  // Bind only after exact source and Access outcomes receive independent acceptance.
  const account = 'b03e6ea242724c05eb97eb732cceb21d';
  const worker = 'bee-validation-20260909';
  const workerId = '9b7d9c86f72e4af38303e3f9e63ee3c9';
  const oldVersion = '6bc65db6-6d2f-470b-8538-a5b8e0f8211e';
  const expectedHash = '1fc483ce932b5d38d65199a123fe5e65c3b5b58465f25c573afba2e91de2a152';
  const assert = (ok, message) => {if(!ok) throw Error(message);};
  let phase='preflight', version=null, deployAttempted=false, originalBindings=null;
  const ordered=x=>Array.isArray(x)?x.map(ordered):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,ordered(x[k])])):x;
  const canon=x=>JSON.stringify(ordered(x));
  async function api(method,path,body) {
    const r=await fetch('https://api.cloudflare.com/client/v4/accounts/'+account+path,{method,redirect:'manual',headers:body?{'Content-Type':'application/json'}:{},body:body?canon(body):undefined});
    const j=await r.json();assert(r.ok&&j.success,'provider '+method+' HTTP '+r.status);return j.result;
  }
  async function hash(m) {return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',Uint8Array.from(atob(m.content_base64),c=>c.charCodeAt(0)))),x=>x.toString(16).padStart(2,'0')).join('');}
  const bindings=bs=>canon([...bs].map(b=>b.type==='secret_text'?{name:b.name,type:b.type}:b).sort((a,b)=>a.name.localeCompare(b.name)));
  try {
    assert(accountId===account&&!oldVersion.startsWith('__')&&/^[a-f0-9]{64}$/.test(expectedHash),'unbound accepted source');
    const production=canon(await api('GET','/workers/scripts/bee-ai-auth-mcp/deployments'));
    const container=await api('GET','/containers/applications/a0362707-1337-4517-9f84-49b53ecfdfa9');
    assert(container.max_instances===1&&container.configuration?.vcpu===0.25&&container.configuration?.memory_mib===1024&&container.configuration?.disk?.size_mb===4000,'cost allocation drift');
    assert(container.configuration?.observability?.logs?.enabled===false&&container.configuration?.network?.mode==='private','Container privacy drift');
    assert(container.configuration?.image?.endsWith('@sha256:5f732c594b2c5dbb1b06de2ff2ec81bfb45ca075eb6dcb9f71ea6c839ac09306'),'image drift');
    const appState={};for(const a of await api('GET','/access/apps?per_page=100'))appState[a.id]={app:await api('GET','/access/apps/'+a.id),policies:await api('GET','/access/apps/'+a.id+'/policies')};
    const d=await api('GET','/workers/scripts/'+worker+'/deployments');
    assert(d.deployments[0].versions.length===1&&d.deployments[0].versions[0].version_id===oldVersion,'active drift');
    const v=await api('GET','/workers/workers/'+workerId+'/versions/'+oldVersion+'?include=modules');
    originalBindings=v.bindings;
    assert(v.modules.length===1&&await hash(v.modules[0])===expectedHash,'source drift');
    assert(v.bindings.find(b=>b.name==='VALIDATION_EXPIRES_AT')?.text==='2026-09-10T15:18:31.966Z','expired window drift');
    assert(v.bindings.find(b=>b.name==='SIGNUP_ENABLED')?.text==='true','signup drift');
    assert(!v.bindings.some(b=>/SELF_SERVICE|QUOTA/.test(b.name)),'quota configuration drift');
    const instances=await api('GET','/containers/applications/a0362707-1337-4517-9f84-49b53ecfdfa9/instances');
    assert(instances.instances.every(i=>i.status.state==='inactive'),'Container not inactive');
    for(const n of ['STAGING_OWNER_EMAIL','CONSENT_SIGNING_SECRET'])assert(v.bindings.find(b=>b.name===n)?.type==='secret_text','secret missing');
    for(const n of ['BEE_UPSTREAM','BEE_SNI','ACCESS_AUD','ACCESS_TEAM_DOMAIN'])assert(!!v.bindings.find(b=>b.name===n)?.text,'required binding missing');
    const w=await api('GET','/workers/workers/'+workerId), ingress=await api('GET','/workers/scripts/'+worker+'/subdomain');
    assert(w.observability?.enabled===false&&w.observability?.logs?.enabled===false&&w.observability?.traces?.enabled===false&&w.logpush===false,'logging');
    assert(ingress.enabled===true&&ingress.previews_enabled===false,'ingress');
    const body={};
    const fields=['assets','cache_options','compatibility_date','compatibility_flags','containers','limits','main_module','modules','package_dependencies','placement','usage_model'];
    for(const k of fields)if(v[k]!==undefined)body[k]=v[k];
    assert(canon(v.exports?.BeeBridge)===canon({type:'durable-object',storage:'sqlite',container:'BeeBridge'}),'existing export mapping drift');
    assert(canon(v.containers)===canon([{class_name:'BeeBridge',name:'BeeBridge'}]),'existing container mapping drift');
    body.exports=v.exports;
    const starts=new Date().toISOString(),expires=new Date(Date.parse(starts)+20*60*1000).toISOString();
    const expected=v.bindings.map(b=>b.name==='VALIDATION_STARTS_AT'?{...b,text:starts}:b.name==='VALIDATION_EXPIRES_AT'?{...b,text:expires}:b);
    body.bindings=expected.map(b=>b.type==='secret_text'?{type:'inherit',name:b.name,version_id:oldVersion}:b);
    body.annotations={'workers/message':'One approved existing identity; single profile read; twenty-minute expiry; preserve counters.'};
    phase='upload';version=(await api('POST','/workers/workers/'+workerId+'/versions?deploy=false',body)).id;
    const uploaded=await api('GET','/workers/workers/'+workerId+'/versions/'+version+'?include=modules');
    assert(uploaded.modules.length===1&&await hash(uploaded.modules[0])===expectedHash,'uploaded source');
    assert(bindings(uploaded.bindings)===bindings(expected),'uploaded bindings');
    assert(canon(uploaded.exports)===canon(v.exports),'uploaded exports');
    assert(canon(uploaded.containers)===canon(v.containers),'uploaded container linkage');
    for(const k of fields.filter(k=>k!=='modules'))if(body[k]!==undefined)assert(canon(uploaded[k])===canon(body[k]),'preserved metadata '+k);
    assert((await api('GET','/workers/scripts/'+worker+'/deployments')).deployments[0].versions[0].version_id===oldVersion,'upload deployed');
    phase='deploy';deployAttempted=true;await api('POST','/workers/scripts/'+worker+'/deployments',{strategy:'percentage',versions:[{version_id:version,percentage:100}],annotations:{'workers/message':'Activate reviewed single profile-read window; no quota activation or new grants.'}});
    phase='readback';const after=await api('GET','/workers/scripts/'+worker+'/deployments');
    assert(after.deployments[0].versions.length===1&&after.deployments[0].versions[0].version_id===version&&after.deployments[0].versions[0].percentage===100,'active mismatch');
    assert(bindings((await api('GET','/workers/scripts/'+worker+'/settings')).bindings)===bindings(expected),'effective bindings');
    const wa=await api('GET','/workers/workers/'+workerId);
    assert(canon(wa.observability)===canon(w.observability)&&wa.logpush===w.logpush,'logging changed');
    assert(canon(await api('GET','/workers/scripts/'+worker+'/subdomain'))===canon(ingress),'ingress changed');
    assert(canon(await api('GET','/workers/scripts/bee-ai-auth-mcp/deployments'))===production,'production changed');
    const containerAfter=await api('GET','/containers/applications/a0362707-1337-4517-9f84-49b53ecfdfa9');
    assert(containerAfter.max_instances===container.max_instances&&canon(containerAfter.configuration)===canon(container.configuration),'Container settings changed');
    let namespace=null, complete=false;
    for(let page=1;page<=10;page++) {const rows=await api('GET','/workers/durable_objects/namespaces?page='+page+'&per_page=20');namespace=namespace||rows.find(n=>n.id==='5b99701b01df4b2b886be69a0202a0e9');if(rows.length<20){complete=true;break;}}
    assert(complete&&namespace?.script===worker&&namespace.class==='BeeBridge'&&namespace.use_sqlite===true&&namespace.use_containers===true,'Container linkage changed');
    for(const [id,s] of Object.entries(appState)) {
      assert(canon(await api('GET','/access/apps/'+id))===canon(s.app),'Access app changed');
      assert(canon(await api('GET','/access/apps/'+id+'/policies'))===canon(s.policies),'Access policy changed');
    }
    return {accepted:true,observed:new Date().toISOString(),phase,version,deployment:after.deployments[0].id,module_sha256:expectedHash,starts_at:starts,expires_at:expires,expiry_new_york:new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',dateStyle:'full',timeStyle:'long'}).format(new Date(expires)),secrets_inherited:true,quota_not_reset:true,production_unchanged:true,access_unchanged:true};
  }catch(e){
    const failure={accepted:false,phase,version,error:e.message,test_allowed:false};
    if(!deployAttempted) return failure;
    try {
      const before=await api('GET','/workers/scripts/'+worker+'/deployments');
      const current=before.deployments[0];
      assert(current.versions.length===1&&current.versions[0].percentage===100,'rollback split or uncertain traffic');
      const currentId=current.versions[0].version_id;
      assert(currentId===version||currentId===oldVersion,'rollback halted for unrelated concurrent version');
      if(currentId===version) await api('POST','/workers/scripts/'+worker+'/deployments',{strategy:'percentage',versions:[{version_id:oldVersion,percentage:100}],annotations:{'workers/message':'Fail-closed restoration of exact prior expired-window version.'}});
      const restored=await api('GET','/workers/scripts/'+worker+'/deployments');
      assert(restored.deployments[0].versions.length===1&&restored.deployments[0].versions[0].version_id===oldVersion&&restored.deployments[0].versions[0].percentage===100,'rollback deployment readback');
      const settings=await api('GET','/workers/scripts/'+worker+'/settings');
      assert(bindings(settings.bindings)===bindings(originalBindings),'rollback bindings readback');
      const state=await api('GET','/containers/applications/a0362707-1337-4517-9f84-49b53ecfdfa9/instances');
      const inactive=state.instances.every(i=>i.status.state==='inactive');
      return {...failure,rollback:{restored_version:oldVersion,deployment:restored.deployments[0].id,bindings_restored:true,container_inactive:inactive,disposition:inactive?'closed; no test permitted':'STOP: expired version restored but Container termination not verified; observe inactive state without restart'}};
    } catch(rollbackError) {
      return {...failure,rollback:{restored:false,error:rollbackError.message,disposition:'STOP: no test or further activation; operator must resolve exact active version and Container state'}};
    }
  }
}
