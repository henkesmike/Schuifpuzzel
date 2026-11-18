import type {State,Move} from './model.js';
import {applyMove} from './rules.js';
import {interactionMoves} from './interaction.js';
import {barPixels} from './geometry.js';
export interface Stop {x:number;y:number;moves:Move[]}
/** Bereken vooraf alle bereikbare rustpunten. Het tekenen hoeft zo geen spelregels te kennen. */
export function dragStops(state:State,selected:string):Stop[] {
 const stops:Stop[]=[{x:0,y:0,moves:[]}];
 for(const first of interactionMoves(state,selected)) {
  let current=state,move:Move|undefined=first;
  const moves:Move[]=[];
  // Het bord heeft twee lege vakken; een blok kan maximaal twee vakken opschuiven.
  while(move&&moves.length<2) {
   current=applyMove(current,move);moves.push(move);
   if(move.kind==='transfer') {
    const a=barPixels(state),b=barPixels(current);stops.push({x:b.x-a.x,y:b.y-a.y,moves:[...moves]});break;
   }
   stops.push({x:first.dx*100*moves.length,y:first.dy*100*moves.length,moves:[...moves]});
   move=interactionMoves(current,selected).find(m=>m.kind===first.kind&&m.dx===first.dx&&m.dy===first.dy);
  }
 }
 return stops;
}
export function clampOffset(value:number,stops:Stop[],axis:'x'|'y'):number {
 const values=stops.map(s=>s[axis]);return Math.max(Math.min(...values),Math.min(Math.max(...values),value));
}
export function nearestStop(x:number,y:number,stops:Stop[]):Stop {
 return stops.reduce((best,s)=>Math.hypot(s.x-x,s.y-y)<Math.hypot(best.x-x,best.y-y)?s:best,stops[0]);
}
