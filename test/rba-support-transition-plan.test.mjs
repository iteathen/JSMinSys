import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {prepareSupportBasisPlans32} from '../addons/rba-connect4-support-basis-plan.mjs';

test('direct transition records reproduce physical removal and owner survival for all small supports',()=>{
 let checks=0,dead=0;
 for(const [columns,rows] of [[1,4],[4,1],[4,4],[6,4],[2,10],[10,1]]){
  const g=prepareConnect4RbaGeometry({columns,rows}),plan=prepareSupportBasisPlans32(g,32*2**20,true,true,true);
  assert.ok(plan.transitions,'complete transition plan required');
  const shapes=Array.from({length:g.shapeCount},(_,id)=>Array.from(g.shapeCells.slice(id*4,id*4+g.shapeSize[id])));
  for(let handle=0;handle<plan.profiles;handle++)for(let c=0;c<columns;c++){
   const height=Math.floor(handle/plan.strides[c])%plan.radix,row=plan.transitionOffsets[handle]+c*plan.sizes[handle]*2,n=plan.sizes[handle];
   if(height===rows){for(let i=0;i<n;i++)assert.equal(plan.transitions[row+2*i],plan.transitionDead);continue;}
   const child=handle+plan.strides[c],map=new Map();
   for(let j=0;j<plan.sizes[child];j++)map.set(shapes[plan.basis[child*g.maxBasis+j]].join(','),j);
   const landing=height*columns+c;
   for(let i=0;i<n;i++){
    const cells=shapes[plan.basis[handle*g.maxBasis+i]],image=cells.filter(v=>v!==landing),at=row+2*i;
    if(!image.length){assert.equal(plan.transitions[at],plan.transitionDead);dead++;}
    else{const expected=map.get(image.join(','));assert.notEqual(expected,undefined);assert.equal(plan.transitions[at],expected);assert.equal(plan.transitions[at+1],cells.includes(landing)?0:1);checks++;}
   }
  }
 }
 assert.ok(checks>10000&&dead>0);console.log(JSON.stringify({checks,dead}));
});

test('packed transition rows have exact injective prefixes without maximum-basis padding',()=>{
 const g=prepareConnect4RbaGeometry({columns:4,rows:4}),plan=prepareSupportBasisPlans32(g,32*2**20,true,true,true);
 assert.ok(plan.transitionOffsets instanceof Uint32Array,'native profile offsets required');
 let expected=0;
 for(let h=0;h<plan.profiles;h++){assert.equal(plan.transitionOffsets[h],expected);expected+=plan.sizes[h]*g.columns*2;}
 assert.equal(plan.transitionOffsets[plan.profiles],expected);assert.equal(plan.transitions.length,expected);
 assert.ok(expected<plan.profiles*g.columns*g.maxBasis*2);
});
