import type {State} from './model.js';
import {barPosition} from './rules.js';
/** De staaf is overal even lang. Alleen de inschuifdiepte verschilt per uitsparing. */
export const BAR_WIDTH=162;
export function barPixels(state:State):{x:number;y:number} {
 const p=barPosition(state);
 const closedOnLeft=state.support==='start'||(Array.isArray(state.support)&&state.pieces.find(p=>p.id===state.support[0])?.shape==='right');
 return {x:p.x*100+(closedOnLeft?33:5),y:p.y*100};
}
