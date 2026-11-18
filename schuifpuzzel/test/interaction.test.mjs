import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,clone,validState} from '../dist/js/model.js';
import {applyMove} from '../dist/js/rules.js';
import {interactionMoves} from '../dist/js/interaction.js';
import {dragStops} from '../dist/js/drag-plan.js';
function place(s,id,x,y){Object.assign(s.pieces.find(p=>p.id===id),{x,y});}
function triple(){
 const s=initialState();
 place(s,'J',2,1);place(s,'E',3,1);place(s,'G',4,1);
 place(s,'C',0,3);place(s,'D',1,2);s.support=['J','E'];
 assert.ok(validState(s));return s;
}
test('richting passende uitsparing beweegt alleen de staaf, ongeacht aangeraakt onderdeel',()=>{
 const s=triple(),before=clone(s);
 for(const id of ['J','E','bar']){
  const right=interactionMoves(s,id).find(m=>m.dx>0&&m.dy===0);
  assert.equal(right.kind,'transfer');
  const next=applyMove(s,right);assert.deepEqual(next.pieces,s.pieces);assert.deepEqual(next.support,['E','G']);
  const stop=dragStops(s,id).find(p=>p.x>0);assert.equal(stop.x,72);assert.equal(stop.moves[0].kind,'transfer');
 }
 assert.deepEqual(s,before);
});
test('omgekeerde richting geeft de staaf ook vanaf beide dragende blokken door',()=>{
 const s=triple();s.support=['E','G'];
 for(const id of ['E','G','bar']){
  const left=interactionMoves(s,id).find(m=>m.dx<0&&m.dy===0);
  assert.equal(left.kind,'transfer');assert.deepEqual(applyMove(s,left).support,['J','E']);
 }
});
test('in een vrije richting beweegt het paar met staaf, ook vanaf de staaf',()=>{
 const s=triple();s.support=['E','G'];
 const blocks=interactionMoves(s,'E'),bar=interactionMoves(s,'bar');assert.deepEqual(bar,blocks);
 const up=blocks.find(m=>m.dy===-1);assert.equal(up.kind,'slide');
 const next=applyMove(s,up);assert.deepEqual(next.support,['E','G']);
 assert.equal(next.pieces.find(p=>p.id==='E').y,0);assert.equal(next.pieces.find(p=>p.id==='G').y,0);
});
test('overdracht naar onderste houder werkt ook door een dragend blok te slepen',()=>{
 const s=initialState();place(s,'E',1,3);place(s,'K',4,1);s.support=['J','E'];
 for(const id of ['J','E','bar']){
  const transfer=interactionMoves(s,id).find(m=>m.kind==='transfer'&&m.dx>0);
  assert.equal(applyMove(s,transfer).support,'finish');
 }
});
test('een los blok geeft geen staaf elders op het bord door',()=>{
 const s=triple();assert.ok(interactionMoves(s,'B').every(m=>m.kind==='slide'));
});
