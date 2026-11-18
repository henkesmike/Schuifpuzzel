import test from 'node:test';
import assert from 'node:assert/strict';
import {VictoryCelebration} from '../dist/js/victory.js';

// Test de levenscyclus zonder een browser te simuleren: canvas-tekenen is hier een lege uitvoer.
function setup(reduced=false){
 const frames=new Map(),timers=new Map(),classes=new Set();let sequence=0;
 globalThis.innerWidth=900;globalThis.innerHeight=800;globalThis.devicePixelRatio=1;
 globalThis.matchMedia=()=>({matches:reduced});
 globalThis.requestAnimationFrame=callback=>{const id=++sequence;frames.set(id,callback);return id;};
 globalThis.cancelAnimationFrame=id=>frames.delete(id);
 globalThis.clearTimeout=id=>timers.delete(id);
 globalThis.window={addEventListener(){},setTimeout(callback){const id=++sequence;timers.set(id,callback);return id;}};
 globalThis.document={hidden:false,addEventListener(){}};
 const context=new Proxy({},{get:(target,key)=>target[key]??(()=>{}),set:(target,key,value)=>{target[key]=value;return true;}});
 const canvas={hidden:true,getContext:()=>context};
 const message={style:{},classList:{add:key=>classes.add(key),remove:key=>classes.delete(key)}};
 const board={getBoundingClientRect:()=>({left:100,top:100,width:600,height:480}),getScreenCTM:()=>null};
 return {celebration:new VictoryCelebration(canvas,message,board),frames,timers,classes,canvas};
}
test('herhaald starten en stoppen laat geen animatieframes of timers achter',()=>{
 const env=setup();env.celebration.play();assert.equal(env.frames.size,1);assert.equal(env.canvas.hidden,false);
 env.celebration.play();assert.equal(env.frames.size,1);assert.equal(env.timers.size,1);
 env.celebration.stop();assert.equal(env.frames.size,0);assert.equal(env.timers.size,0);
 assert.equal(env.canvas.hidden,true);assert.equal(env.classes.has('visible'),false);
});
test('verminderde beweging geeft wel de beloning maar geen vliegende sterren',()=>{
 const env=setup(true);env.celebration.play();
 assert.equal(env.frames.size,0);assert.equal(env.canvas.hidden,true);assert.ok(env.classes.has('visible'));
 env.celebration.stop();assert.equal(env.timers.size,0);
});
test('sterren verdwijnen na afloop en het bericht verdwijnt via de eigen timer',()=>{
 const env=setup();env.celebration.play();
 const [id,callback]=[...env.frames][0];env.frames.delete(id);callback(performance.now()+4200);
 assert.equal(env.canvas.hidden,true);assert.equal(env.frames.size,0);
 [...env.timers.values()][0]();assert.equal(env.classes.has('visible'),false);assert.equal(env.timers.size,0);
});
