import {readdir,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {resolve} from "node:path";

const dir=resolve("dist");
const bundles=(await readdir(resolve(dir,"assets"))).filter(name=>/^[a-zA-Z0-9_.-]+\.(js|css)$/.test(name)).map(name=>"/assets/"+name).sort();
const assets=["/","/index.html",...bundles];
const digest=createHash("sha256").update(assets.join("|")).digest("hex").slice(0,12);
if(!bundles.length)throw Error("No compiled JS or CSS assets available.");
const script=[
 "const CACHE="+JSON.stringify("daskalov-offline-"+digest)+";",
 "const ASSETS="+JSON.stringify(assets)+";",
 'self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));',
 'self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(name=>name.startsWith("daskalov-offline-")&&name!==CACHE).map(name=>caches.delete(name)))).then(()=>self.clients.claim())));',
 'self.addEventListener("fetch",event=>{',
 ' const req=event.request;',
 ' if(req.method!=="GET")return;',
 ' const url=new URL(req.url);',
 ' if(url.origin!==self.location.origin||url.pathname.startsWith("/api/"))return;',
 ' if(req.mode==="navigate"){event.respondWith(fetch(req).catch(()=>caches.match("/index.html")));return;}',
 ' if(!ASSETS.includes(url.pathname))return;',
 ' event.respondWith(caches.match(req).then(found=>found||fetch(req)));',
 '});'
].join("\n");
await writeFile(resolve(dir,"sw.js"),script);
console.log("Service worker offline demo: "+assets.length+" static files, revision "+digest);
