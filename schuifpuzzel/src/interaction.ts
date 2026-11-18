import type {State,Move} from './model.js';
import {legalMoves,transfers} from './rules.js';
/**
 * Bij een gekoppeld paar bepaalt de richting wat beweegt, niet de plek van aanraken.
 * Een passende uitsparing naast het paar blokkeert het schuiven van de blokken;
 * in die richting wordt daarom alleen de staaf doorgegeven. In vrije richtingen
 * bewegen de twee blokken met de staaf als één geheel, ook bij aanraken van de staaf.
 * De spelregels blijven in rules.ts; dit onderdeel vertaalt alleen de gebruikersintentie.
 */
export function interactionMoves(state:State,selected:string):Move[] {
 const support=state.support;
 const coupled=Array.isArray(support)&&(selected==='bar'||support.includes(selected));
 if(!coupled)return legalMoves(state,selected);
 const slides=legalMoves(state,support[0]);
 const handovers=transfers(state);
 return [
  ...slides.filter(slide=>!handovers.some(transfer=>Math.sign(slide.dx)===Math.sign(transfer.dx)&&slide.dy===0)),
  ...handovers
 ];
}
