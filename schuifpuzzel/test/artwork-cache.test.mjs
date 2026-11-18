import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const workerSource=await readFile(new URL('../dist/sw.js',import.meta.url),'utf8');
function worker(cached){
 const listeners=new Map(),requests=[],writes=[];
 const cache={match:async()=>cached,put:async(request,response)=>writes.push({request,response})};
 const response={ok:true,clone(){return this;}};
 const scope={URL,self:{location:{origin:'https://puzzel.example'},addEventListener:(name,handler)=>listeners.set(name,handler)},
  caches:{open:async()=>cache},fetch:async request=>{requests.push(request);return response;}};
 vm.runInNewContext(workerSource,scope);
 async function request(path){
  let result;const background=[];
  listeners.get('fetch')({request:{url:'https://puzzel.example'+path,method:'GET'},
   respondWith:promise=>{result=promise;},waitUntil:promise=>background.push(promise)});
  const value=await result;await Promise.all(background);return value;
 }
 return {request,requests,writes,response};
}
test('bewaarde paarse afbeelding verschijnt zonder op het netwerk te wachten',async()=>{
 const cached={name:'paarse afbeelding'},env=worker(cached);
 assert.equal(await env.request('/assets/left-violet.png'),cached);
 assert.equal(env.requests.length,0);
});
test('een nog niet bewaarde afbeelding wordt geladen en klaargezet voor hergebruik',async()=>{
 const env=worker(undefined);
 assert.equal(await env.request('/assets/through-violet.png'),env.response);
 assert.equal(env.requests.length,1);assert.equal(env.writes.length,1);
});
test('HTML blijft via het netwerk vernieuwen, ook wanneer er een oude cache is',async()=>{
 const env=worker({name:'oude pagina'});
 assert.equal(await env.request('/index.html'),env.response);assert.equal(env.requests.length,1);
});
test('beide kleuren zijn gedecodeerd voordat de voorbereiding klaar is; herhaalde oproep hergebruikt die',async()=>{
 const pending=[],images=[];
 globalThis.Image=class {constructor(){images.push(this);}decode(){return new Promise(resolve=>pending.push(resolve));}};
 const {prepareArtwork}=await import('../dist/js/artwork.js?ready-test');
 let finished=false;const first=prepareArtwork();first.then(()=>{finished=true;});
 assert.equal(prepareArtwork(),first);
 assert.ok(images.some(image=>image.src.endsWith('/through-violet.png')));
 assert.ok(images.some(image=>image.src.endsWith('/dock-left-violet.png')));
 assert.ok(images.some(image=>image.src.endsWith('/right-mint.png')));
 pending.slice(1).forEach(resolve=>resolve());await Promise.resolve();assert.equal(finished,false);
 pending[0]();await first;assert.equal(finished,true);delete globalThis.Image;
});
test('één ontbrekende afbeelding blokkeert het starten van de puzzel niet',async()=>{
 let index=0;
 globalThis.Image=class {decode(){return index++===0?Promise.reject(new Error('ontbreekt')):Promise.resolve();}};
 const {prepareArtwork}=await import('../dist/js/artwork.js?failure-test');
 await assert.doesNotReject(prepareArtwork());delete globalThis.Image;
});
