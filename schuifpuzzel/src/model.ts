/** Pure gegevens: coördinaten beginnen linksboven bij (0, 0). */
export type Shape = 'square' | 'vertical' | 'horizontal' | 'right' | 'left' | 'through';
export interface Piece { id: string; shape: Shape; x: number; y: number }
export type Support = 'start' | 'finish' | [string, string];
export interface State { pieces: Piece[]; support: Support; moves: number }
export interface Move { label: string; dx: number; dy: number; kind: 'slide' | 'transfer'; ids: string[]; support?: Support }
export const WIDTH = 5, HEIGHT = 4;
export const DOCKS = [{x:1,y:0}, {x:2,y:3}];
export function initialState(): State {
  return {moves:0, support:'start', pieces:[
    {id:'A',shape:'vertical',x:0,y:0}, {id:'B',shape:'square',x:1,y:1},
    {id:'C',shape:'square',x:3,y:0}, {id:'D',shape:'square',x:4,y:0},
    {id:'E',shape:'through',x:4,y:1}, {id:'F',shape:'square',x:0,y:2},
    {id:'G',shape:'left',x:1,y:2}, {id:'H',shape:'horizontal',x:2,y:2},
    {id:'I',shape:'vertical',x:4,y:2}, {id:'J',shape:'right',x:0,y:3},
    {id:'K',shape:'square',x:1,y:3}
  ]};
}
export const clone = (state: State): State => structuredClone(state);
export function size(piece: Piece): [number,number] {
  return [piece.shape === 'horizontal' ? 2 : 1, piece.shape === 'vertical' ? 2 : 1];
}
export function cells(piece: Piece): string[] {
  const [w,h] = size(piece);
  return Array.from({length:w*h},(_,i)=>`${piece.x+i%w},${piece.y+Math.floor(i/w)}`);
}
/** Ook geladen spellen moeten hetzelfde bord en dezelfde elf stukken beschrijven. */
export function validState(value: unknown): value is State {
  if (!value || typeof value !== 'object') return false;
  const s = value as State, original = initialState();
  if (!Array.isArray(s.pieces) || s.pieces.length!==11 || !Number.isInteger(s.moves) || s.moves<0) return false;
  const occupied = new Set(DOCKS.flatMap(d=>[`${d.x},${d.y}`,`${d.x+1},${d.y}`]));
  const ids = new Set<string>();
  for (const p of s.pieces) {
    if (!p || ids.has(p.id) || !original.pieces.some(o=>o.id===p.id && o.shape===p.shape)) return false;
    ids.add(p.id);
    const [w,h]=size(p);
    if (!Number.isInteger(p.x)||!Number.isInteger(p.y)||p.x<0||p.y<0||p.x+w>5||p.y+h>4) return false;
    for (const c of cells(p)) { if (occupied.has(c)) return false; occupied.add(c); }
  }
  if (s.support==='start'||s.support==='finish') return true;
  if (!Array.isArray(s.support)||s.support.length!==2) return false;
  const [a,b]=s.support.map(id=>s.pieces.find(p=>p.id===id));
  return !!a && !!b && a.y===b.y && b.x===a.x+1 &&
    ((a.shape==='right'&&b.shape==='through')||(a.shape==='through'&&b.shape==='left'));
}
