import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,validState,clone} from '../dist/js/model.js';
import {legalMoves,applyMove,transfers,isSolved} from '../dist/js/rules.js';
function place(s,id,x,y){Object.assign(s.pieces.find(p=>p.id===id),{x,y});}
test('beginstand heeft elf blokken, twee vrije vakken en een geblokkeerde staaf',()=>{
 const s=initialState();assert.ok(validState(s));assert.equal(s.pieces.length,11);assert.equal(transfers(s).length,0);
 assert.deepEqual(legalMoves(s,'B').map(m=>m.label),['Rechts']);
});
test('staaf uit beginhouder, gekoppelde blokken en overdracht naar derde blok',()=>{
 const s=initialState();place(s,'E',3,0);place(s,'G',4,0);place(s,'C',4,1);place(s,'D',1,2);
 assert.ok(validState(s));const next=applyMove(s,transfers(s)[0]);assert.deepEqual(next.support,['E','G']);
 assert.equal(s.support,'start','invoer blijft ongewijzigd');
 assert.ok(legalMoves(next,'E').every(m=>m.ids.includes('G')));
 assert.equal(transfers(next)[0].support,'start');
 // Een vrij opgesteld drietal laat de staaf horizontaal van paar wisselen.
 const third=clone(next);place(third,'J',2,1);place(third,'E',3,1);place(third,'G',4,1);place(third,'C',0,3);
 assert.ok(validState(third));const transfer=transfers(third)[0];
 assert.deepEqual(transfer.support,['J','E']);const shifted=applyMove(third,transfer);
 assert.deepEqual(shifted.pieces,third.pieces,'alleen de staaf verandert bij overdracht');
});
test('onderste vaste houder is het einddoel',()=>{
 const s=initialState();place(s,'E',1,3);place(s,'K',4,1);s.support=['J','E'];
 assert.ok(validState(s));assert.equal(isSolved(s),false);
 const solved=applyMove(s,transfers(s).find(m=>m.support==='finish'));
 assert.ok(isSolved(solved));assert.equal(solved.moves,1);
});
test('ongeldige zetten, overlappende blokken en beschadigde opslag worden geweigerd',()=>{
 const s=initialState();assert.throws(()=>applyMove(s,{kind:'slide',label:'',dx:-1,dy:0,ids:['A']}));
 const broken=clone(s);broken.pieces[0].x=1;assert.equal(validState(broken),false);
 assert.equal(validState(null),false);assert.equal(validState({...s,support:['A','B']}),false);
});
test('duizend opeenvolgende legale zetten behouden alle bordvoorwaarden',()=>{
 let s=initialState(),seed=42;
 for(let i=0;i<1000;i++){
  const moves=[...s.pieces.flatMap(p=>legalMoves(s,p.id)),...transfers(s)];
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  s=applyMove(s,moves[seed%moves.length]);assert.ok(validState(s));
 }
});
