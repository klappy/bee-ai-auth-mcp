import { expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { embeddedAssets } from "../src/embedded-assets";
const manifest = JSON.parse(readFileSync("RUNTIME-MANIFEST.json", "utf8"));
const request = (path:string, init?:RequestInit) => new Request("https://isolated.invalid"+path, init);
it.each(Object.keys(manifest.assets))("serves exact frozen bytes and HEAD metadata: %s", async file => {
 const path=file==="index.html"?"/":file.endsWith(".html")?"/"+file.slice(0,-5):"/"+file;
 const res=await embeddedAssets.fetch(request(path));const bytes=Buffer.from(await res.arrayBuffer());
 expect(res.status).toBe(200);expect(bytes.equals(readFileSync("public/"+file))).toBe(true);
 expect(createHash("sha256").update(bytes).digest("hex")).toBe(manifest.assets[file].sha256);
 expect(res.headers.get("content-length")).toBe(String(bytes.length));
 const mime=file.endsWith('.html')?'text/html; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':file.endsWith('.png')?'image/png':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.ico')?'image/x-icon':'application/manifest+json';
 expect(res.headers.get('content-type')).toBe(mime);
 const head=await embeddedAssets.fetch(request(path,{method:"HEAD"}));expect(await head.text()).toBe("");expect([...head.headers]).toEqual([...res.headers]);
});
it("normalizes only known HTML routes and preserves queries",async()=>{
 for(const file of Object.keys(manifest.assets).filter(f=>f.endsWith('.html'))){
 const stem=file.slice(0,-5);const target=stem==='index'?'/':'/'+stem;
 const aliases=stem==='index'?['/index','/index.html']:['/'+file,'/'+stem+'/','/'+stem+'/index','/'+stem+'/index.html'];
 for(const alias of aliases){const res=await embeddedAssets.fetch(request(alias+'?a=1'));expect(res.status).toBe(307);expect(res.headers.get('location')).toBe(target+'?a=1');}
 }
 for(const path of ['/missing','/missing.html','/setup/unknown','/favicon.png','/%2fsetup'])expect((await embeddedAssets.fetch(request(path))).status).toBe(404);
});
it("implements conditional caching without fabricated edge receipts",async()=>{
 const res=await embeddedAssets.fetch(request('/'));const etag=res.headers.get('etag')!;expect(res.headers.get('cache-control')).toBe('public, max-age=0, must-revalidate');expect(res.headers.has('cf-cache-status')).toBe(false);
 for(const value of [etag,'W/'+etag,'"other", W/'+etag,'*']){const matched=await embeddedAssets.fetch(request('/',{headers:{'If-None-Match':value}}));expect(matched.status).toBe(304);expect(await matched.text()).toBe('');}
 for(const headers of [{Authorization:'synthetic'},{Range:'bytes=0-1'}]){const full=await embeddedAssets.fetch(request('/',{headers}));expect(full.status).toBe(200);expect(full.headers.has('cache-control')).toBe(false);expect((await full.arrayBuffer()).byteLength).toBe(manifest.assets['index.html'].size);}
});
