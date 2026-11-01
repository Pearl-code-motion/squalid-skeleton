/* Cache-first : l’interface reste disponible après son premier chargement. */
const CACHE='courses-pwa-v16';
const FILES=['./','./index.html','./style.css','./app.js','./sw.js','./manifest.json','./icon-180.png','./icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const r=event.request;if(r.method!=='GET'||new URL(r.url).origin!==self.location.origin)return;event.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(response=>{if(response.ok)caches.open(CACHE).then(c=>c.put(r,response.clone()));return response;}).catch(()=>r.mode==='navigate'?caches.match('./index.html'):new Response('',{status:503,statusText:'Hors ligne'}))));});
