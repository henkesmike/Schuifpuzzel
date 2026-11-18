import type {State,Move} from './model.js';
import {dragStops,clampOffset,nearestStop,Stop} from './drag-plan.js';
interface Gesture {pointer:number;start:DOMPoint;axis:'x'|'y'|null;stops:Stop[];nodes:MovingNode[];movingNodes:MovingNode[];x:number;y:number}
interface MovingNode {element:SVGElement;base:string}
/** Tijdelijke sleepcoördinaten staan los van het echte bord. Pas na het landen wordt een zet uitgevoerd. */
export class BoardMotion {
 private gesture:Gesture|null=null;
 private settling=false;
 get busy():boolean {return this.settling||this.gesture!==null;}
 constructor(private board:SVGSVGElement,private state:()=>State,private select:(id:string)=>void,private commit:(moves:Move[])=>void,private unlockSound:()=>void) {
  board.addEventListener('pointerdown',e=>this.start(e));
  board.addEventListener('pointermove',e=>this.drag(e));
  board.addEventListener('pointerup',e=>this.end(e,false));
  board.addEventListener('pointercancel',e=>this.end(e,true));
  board.addEventListener('lostpointercapture',e=>this.end(e as PointerEvent,true));
 }
 private point(event:PointerEvent):DOMPoint {
  const matrix=this.board.getScreenCTM();
  return matrix?new DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse()):new DOMPoint();
 }
 private nodes(id:string):MovingNode[] {
  const state=this.state();
  const coupled=Array.isArray(state.support)&&(id==='bar'||state.support.includes(id));
  const ids=coupled?[...state.support as [string,string],'bar']:[id];
  return ids.map(id=>this.board.querySelector<SVGElement>(`[data-id="${id}"]`)!).filter(Boolean).map(element=>({element,base:element.getAttribute('transform')||''}));
 }
 private offset(nodes:MovingNode[],x:number,y:number):void {
  nodes.forEach(n=>n.element.setAttribute('transform',`${n.base} translate(${x},${y})`));
 }
 private start(event:PointerEvent):void {
  if(this.busy||!event.isPrimary||event.button!==0)return;
  const target=(event.target as Element).closest('[data-select-id], [data-id]');
  const id=target?.getAttribute('data-select-id')??target?.getAttribute('data-id');if(!id)return;
  event.preventDefault();this.unlockSound();this.select(id);
  this.gesture={pointer:event.pointerId,start:this.point(event),axis:null,stops:dragStops(this.state(),id),nodes:this.nodes(id),movingNodes:[],x:0,y:0};
  this.board.setPointerCapture(event.pointerId);this.board.classList.add('dragging');
 }
 private drag(event:PointerEvent):void {
  const g=this.gesture;if(!g||g.pointer!==event.pointerId)return;
  const p=this.point(event),dx=p.x-g.start.x,dy=p.y-g.start.y;
  // Net als de Android-versie begrenzen we de beweging tot de vrije ruimte.
  // Een eenmaal gekozen as blijft vast om onrustig verspringen tijdens slepen te voorkomen.
  if(!g.axis&&Math.max(Math.abs(dx),Math.abs(dy))>4)g.axis=Math.abs(dx)>Math.abs(dy)?'x':'y';
  g.x=g.axis==='x'?clampOffset(dx,g.stops.filter(s=>s.y===0),'x'):0;
  g.y=g.axis==='y'?clampOffset(dy,g.stops.filter(s=>s.x===0),'y'):0;
  // Bij omkeren kan een blokbeweging in een staafbeweging veranderen, of andersom.
  // Zet eerst alle onderdelen terug en verplaats alleen de bedoelde onderdelen.
  this.offset(g.nodes,0,0);
  const intended=g.stops.find(stop=>stop.moves.length&&
   (g.axis==='x'?stop.y===0&&Math.sign(stop.x)===Math.sign(dx):stop.x===0&&Math.sign(stop.y)===Math.sign(dy)));
  g.movingNodes=intended?.moves[0].kind==='transfer'
   ?g.nodes.filter(node=>node.element.getAttribute('data-id')==='bar'):g.nodes;
  this.offset(g.movingNodes,g.x,g.y);
 }
 private end(event:PointerEvent,cancelled:boolean):void {
  const g=this.gesture;if(!g||event.pointerId!==g.pointer)return;
  if(!cancelled)this.drag(event);
  this.gesture=null;this.board.classList.remove('dragging');
  if(this.board.hasPointerCapture(g.pointer))this.board.releasePointerCapture(g.pointer);
  const stops=g.stops.filter(s=>!g.axis||(g.axis==='x'?s.y===0:s.x===0));
  const destination=cancelled?g.stops[0]:nearestStop(g.x,g.y,stops);
  void this.settle(g.movingNodes,g.x,g.y,destination);
 }
 /** Knoppen en toetsen gebruiken precies dezelfde rustige landingsanimatie. */
 perform(selected:string,move:Move):void {
  if(this.busy)return;this.unlockSound();
  const destination=dragStops(this.state(),selected).find(s=>s.moves.length===1&&s.moves[0].kind===move.kind&&s.moves[0].dx===move.dx&&s.moves[0].dy===move.dy);
  if(destination) {
   const nodes=this.nodes(selected).filter(node=>move.kind!=='transfer'||node.element.getAttribute('data-id')==='bar');
   void this.settle(nodes,0,0,destination);
  }
 }
 private async settle(nodes:MovingNode[],fromX:number,fromY:number,to:Stop):Promise<void> {
  this.settling=true;
  const duration=matchMedia('(prefers-reduced-motion: reduce)').matches?0:190;
  await new Promise<void>(resolve=>{
   const start=performance.now();
   const frame=(time:number)=>{
    const progress=duration===0?1:Math.min(1,(time-start)/duration);
    const ease=1-Math.pow(1-progress,3);
    this.offset(nodes,fromX+(to.x-fromX)*ease,fromY+(to.y-fromY)*ease);
    if(progress<1)requestAnimationFrame(frame);else resolve();
   };requestAnimationFrame(frame);
  });
  this.settling=false;
  if(to.moves.length)this.commit(to.moves);
 }
}
