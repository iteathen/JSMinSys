import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {prepareSupportBasisPlans32} from '../addons/rba-connect4-support-basis-plan.mjs';

test('support reflection maps equal physical cell reflection and form an involution on every small profile',()=>{
 let checks=0;
 for(const [columns,rows] of [[1,4],[4,1],[4,4],[6,4],[3,3]]){
  const g=prepareConnect4RbaGeometry({columns,rows}),plan=prepareSupportBasisPlans32(g,16*2**20,true,true);
  assert.ok(plan.mirrorMap,'complete reflection permutation required');assert.ok(plan.mirrorProfiles);
  for(let index=0;index<plan.profiles;index++){
   let expectedMirror=0;
   for(let c=0;c<columns;c++)expectedMirror+=Math.floor(index/plan.strides[c])%plan.radix*plan.strides[columns-1-c];
   const mirror=plan.mirrorProfiles[index];assert.equal(mirror,expectedMirror);assert.equal(plan.mirrorProfiles[mirror],index);
   const n=plan.sizes[index];assert.equal(plan.sizes[mirror],n);
   for(let i=0;i<n;i++){
    const id=plan.basis[index*g.maxBasis+i],j=plan.mirrorMap[index*g.maxBasis+i],other=plan.basis[mirror*g.maxBasis+j];
    const physical=Array.from(g.shapeCells.slice(id*4,id*4+g.shapeSize[id]),cell=>Math.floor(cell/columns)*columns+columns-1-cell%columns).sort((a,b)=>a-b);
    assert.deepEqual(Array.from(g.shapeCells.slice(other*4,other*4+g.shapeSize[other])),physical);
    assert.equal(plan.mirrorMap[mirror*g.maxBasis+j],i);checks++;
   }
  }
 }
 assert.ok(checks>1000);
});
