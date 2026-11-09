const CACHE_NAME = "mushafi-shell-v2";
const APP_SHELL = ["./","./index.html","./manifest.json","./logo.png","./icon-192.png","./icon-512.png","./favicon-32.png"];
self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(key => key.startsWith("mushafi-shell-") && key !== CACHE_NAME).map(key => caches.delete(key)))
  ).then(() => self.clients.claim()));
});
self.addEventListener("fetch", event => {
  const request=event.request, url=new URL(request.url);
  if(request.method!=="GET" || url.origin!==self.location.origin) return;
  event.respondWith(caches.match(request).then(cached => {
    const network=fetch(request).then(response=>{
      if(response && response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(request,copy));}
      return response;
    });
    return cached || network.catch(()=>caches.match("./index.html"));
  }));
});
