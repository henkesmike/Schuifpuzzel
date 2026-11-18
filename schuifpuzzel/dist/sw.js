// Verhoog deze versie wanneer de appbestanden veranderen.
const CACHE='staafpuzzel-7';
const FILES=["./", "./index.html", "./style.css", "./manifest.webmanifest", "./icon.svg", "./js/app.js", "./js/artwork.js", "./js/model.js", "./js/rules.js", "./js/storage.js", "./js/board-view.js", "./js/geometry.js", "./js/drag-plan.js", "./js/board-motion.js", "./js/sound.js", "./js/interaction.js", "./js/victory.js", "./assets/dock-left-cream.png", "./assets/dock-left-violet.png", "./assets/dock-right-cream.png", "./assets/dock-right-violet.png", "./assets/horizontal-mint.png", "./assets/horizontal-violet.png", "./assets/left-mint.png", "./assets/left-violet.png", "./assets/right-mint.png", "./assets/right-violet.png", "./assets/rod-gold.png", "./assets/rod-pink.png", "./assets/square-mint.png", "./assets/square-violet.png", "./assets/through-mint.png", "./assets/through-violet.png", "./assets/vertical-mint.png", "./assets/vertical-violet.png"];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
/** Afbeeldingen blijven gelijk gedurende een appversie en komen direct uit de cache.
 * HTML en code worden via het netwerk vernieuwd, met offline-terugval.
 */
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(url.pathname.includes('/assets/')){
  event.respondWith((async()=>{
   const cache=await caches.open(CACHE);
   const stored=await cache.match(request);
   if(stored)return stored;
   const response=await fetch(request);
   if(response.ok)event.waitUntil(cache.put(request,response.clone()));
   return response;
  })());
  return;
 }
 event.respondWith(fetch(request).then(response=>{
  if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)));}
  return response;
 }).catch(()=>caches.match(request)));
});
