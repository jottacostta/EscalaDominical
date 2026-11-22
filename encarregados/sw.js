// Service worker do app instalável (PWA). Estratégia: rede primeiro, cai no cache quando offline.
const CACHE='escala-encarregados-v1';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS).catch(()=>{})).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(resp=>{const c=resp.clone();caches.open(CACHE).then(ca=>ca.put(e.request,c));return resp;}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));});
