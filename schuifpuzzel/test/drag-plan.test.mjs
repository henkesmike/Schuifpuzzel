import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,clone} from '../dist/js/model.js';
import {dragStops,clampOffset,nearestStop} from '../dist/js/drag-plan.js';
import {BAR_WIDTH,barPixels} from '../dist/js/geometry.js';
function place(s,id,x,y){Object.assign(s.pieces.find(p=>p.id===id),{x,y});}
test('slepen wordt begrensd en landt op het dichtstbijzijnde geldige vak',()=>{
 const s=initialState(),stops=dragStops(s,'B');
 assert.deepEqual(stops.map(p=>[p.x,p.y]),[[0,0],[100,0],[200,0]]);
 assert.equal(clampOffset(400,stops,'x'),200);
 assert.equal(clampOffset(-80,stops,'x'),0);
 assert.equal(nearestStop(40,0,stops).moves.length,0);
 assert.equal(nearestStop(70,0,stops).moves.length,1);
 assert.equal(nearestStop(175,0,stops).moves.length,2);
});
test('staaf eindigt aan de rand en overdracht gebruikt de werkelijke schermafstand',()=>{
 const s=initialState();assert.equal(barPixels(s).x+BAR_WIDTH,295);
 place(s,'E',3,0);place(s,'G',4,0);place(s,'C',4,1);place(s,'D',1,2);
 const before=clone(s),stops=dragStops(s,'bar');
 assert.deepEqual(s,before,'voorbereiden van slepen verandert het spel niet');
 assert.equal(stops[1].x,172);
 assert.equal(stops[1].moves.length,1);
});
test('gekoppelde blokken hebben dezelfde rustpunten en blijven gekoppeld',()=>{
 const s=initialState();place(s,'E',3,0);place(s,'G',4,0);place(s,'C',4,1);place(s,'D',1,2);s.support=['E','G'];
 const before=clone(s);
 assert.deepEqual(dragStops(s,'E'),dragStops(s,'G'));
 assert.deepEqual(s,before);
});
