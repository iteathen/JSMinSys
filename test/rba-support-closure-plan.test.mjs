import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {prepareSupportBasisPlans32} from '../addons/rba-connect4-support-basis-plan.mjs';
import * as api from '../addons/rba-connect4-support-basis-plan.mjs';

test('support closure masks equal independent cell-subset enumeration on every admitted small support',()=>{
 for(const [columns,rows] of [[3,3],[4,4],[1,8],[8,1],[6,4]]){
  const g=prepareConnect4RbaGeometry({columns,rows}),plan=prepareSupportBasisPlans32(g,8*2**20,true);
  assert.ok(plan.closures instanceof Uint32Array,'complete closure plan required');
  const shapes=Array.from({length:g.shapeCount},(_,id)=>Array.from(g.shapeCells.slice(id*4,id*4+g.shapeSize[id])));
  for(let index=0;index<plan.profiles;index++){
   const n=plan.sizes[index],row=index*g.maxBasis;
   for(let i=0;i<n;i++){
    const cells=shapes[plan.basis[row+i]],expected=new Uint32Array(g.coordWords);
    for(let j=0;j<n;j++)if(cells.every(cell=>shapes[plan.basis[row+j]].includes(cell)))expected[j>>>5]|=1<<(j&31);
    const base=(row+i)*g.coordWords;
    assert.deepEqual(plan.closures.slice(base,base+g.coordWords),expected);
   }
  }
 }
 const g=prepareConnect4RbaGeometry({columns:7,rows:6});
 assert.equal(prepareSupportBasisPlans32(g,256*2**20,true),null,'must not admit an incomplete plan');
});

test('cold-selected three-word/general closure OR preserves owner isolation and offset guards',()=>{
 assert.equal(typeof api.applySupportClosure3x32,'function');assert.equal(typeof api.applySupportClosureSpan32,'function');
 for(const count of [0,1,2,3,4,7])for(const write0 of [false,true])for(const write1 of [false,true]){
  const closures=Uint32Array.from({length:count+5},(_,i)=>(0x81234567+i)>>>0),out=new Uint32Array(2*count+17).fill(0x12345678),before=out.slice(),expected=out.slice(),p0=3,p1=count+9;
  for(let i=0;i<count;i++){if(write0)expected[p0+i]|=closures[2+i];if(write1)expected[p1+i]|=closures[2+i];}
  api.applySupportClosureSpan32(closures,2,count,out,p0,p1,write0,write1);
  assert.deepEqual(out,expected);
  if(count===3){out.set(before);api.applySupportClosure3x32(closures,2,count,out,p0,p1,write0,write1);assert.deepEqual(out,expected);}
 }
});
