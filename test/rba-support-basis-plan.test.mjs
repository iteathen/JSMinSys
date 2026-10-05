import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
const api=await import('../addons/rba-connect4-support-basis-plan.mjs').catch(()=>({}));

test('shared support plans reproduce independently enumerated physical residual bases',()=>{
 assert.equal(typeof api.prepareSupportBasisPlans32,'function');
 for(const [columns,rows] of [[3,3],[4,4],[1,8],[8,1],[6,4]]){
  const g=prepareConnect4RbaGeometry({columns,rows}),plan=api.prepareSupportBasisPlans32(g,8*2**20);
  assert.ok(plan);assert.ok(plan.basis.buffer instanceof SharedArrayBuffer);
  assert.ok(Object.isFrozen(plan));assert.ok(plan.bytes<=8*2**20);
  const ids=new Map(),lines=[];
  for(let id=0;id<g.shapeCount;id++)ids.set(Array.from(g.shapeCells.slice(id*4,id*4+g.shapeSize[id])).join(','),id);
  for(let r=0;r<rows;r++)for(let c=0;c<columns;c++)for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]])
   if(c+3*dx<columns&&r+3*dy>=0&&r+3*dy<rows)lines.push(Array.from({length:4},(_,k)=>(r+k*dy)*columns+c+k*dx).sort((a,b)=>a-b));
  for(let index=0;index<plan.profiles;index++){
   const heights=new Uint32Array(columns);let x=index;
   for(let c=0;c<columns;c++){heights[c]=x%(rows+1);x=Math.floor(x/(rows+1));}
   const expected=Array.from(new Set(lines.map(l=>l.filter(cell=>Math.floor(cell/columns)>=heights[cell%columns])).filter(l=>l.length).map(l=>ids.get(l.join(','))))).sort((a,b)=>a-b);
   assert.ok(!expected.includes(undefined));
   assert.deepEqual(Array.from(plan.basis.slice(index*g.maxBasis,index*g.maxBasis+plan.sizes[index])),expected);
   const seen=new Uint32Array(g.shapeWordCount);for(const id of expected)seen[id>>>5]|=1<<(id&31);
   assert.deepEqual(plan.membership.slice(index*g.shapeWordCount,(index+1)*g.shapeWordCount),seen);
   const target=new Uint32Array(g.keyWords+4),basis=new Uint32Array(g.maxBasis+5),scratch=new Uint32Array(g.shapeWordCount);
   target.set(heights,2);const beforeBasis=plan.basis.slice(index*g.maxBasis,(index+1)*g.maxBasis),beforeMask=plan.membership.slice(index*g.shapeWordCount,(index+1)*g.shapeWordCount);
   const size=api.loadSupportBasis32({...g,supportBasisPlans:plan},target,2,basis,3,scratch);
   assert.deepEqual(Array.from(basis.slice(3,3+size)),expected);assert.deepEqual(scratch,seen);
   assert.deepEqual(plan.basis.slice(index*g.maxBasis,(index+1)*g.maxBasis),beforeBasis);
   assert.deepEqual(plan.membership.slice(index*g.shapeWordCount,(index+1)*g.shapeWordCount),beforeMask);
  }
 }
});

test('support-plan admission handles generic widths and returns a cold budget fallback',()=>{
 assert.equal(typeof api.prepareSupportBasisPlans32,'function');
 for(const [columns,rows] of [[7,6],[7,5],[41,4],[4,33],[10,10]]){
  const g=prepareConnect4RbaGeometry({columns,rows});
  assert.equal(api.prepareSupportBasisPlans32(g,1),null);
 }
 const g=prepareConnect4RbaGeometry({columns:4,rows:4});
 for(const budget of [-1,1.5,NaN,Infinity])assert.throws(()=>api.prepareSupportBasisPlans32(g,budget),RangeError);
 assert.equal(api.prepareSupportBasisPlans32(g,0),null);
});
