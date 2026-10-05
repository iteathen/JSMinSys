import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {prepareSupportBasisPlans32,loadSupportClosureBasis32} from '../addons/rba-connect4-support-basis-plan.mjs';

test('closure basis loading builds exact inverse in the same pass without clearing unrelated scratch',()=>{
 const g=prepareConnect4RbaGeometry({columns:4,rows:4});
 g.supportBasisPlans=prepareSupportBasisPlans32(g,8*2**20,true);
 const target=new Uint32Array(g.keyWords+7),basis=new Uint32Array(g.maxBasis+7).fill(0xffffffff),
  seen=new Uint32Array(g.shapeWordCount).fill(0x12345678),indexOut=new Uint32Array(1),inverse=new Uint32Array(g.shapeCount).fill(0xffffffff);
 target.set([1,2,3,0],3);
 const n=loadSupportClosureBasis32(g,target,3,basis,4,seen,indexOut,inverse);
 assert.ok(n>0);assert.equal(indexOut[0],1+2*5+3*25);
 const ids=new Set(basis.slice(4,4+n));
 for(let i=0;i<n;i++)assert.equal(inverse[basis[4+i]],i,'loader must publish current inverse, not leave a second traversal');
 for(let id=0;id<g.shapeCount;id++)if(!ids.has(id))assert.equal(inverse[id],0xffffffff);
 assert.ok(seen.every(v=>v===0x12345678));assert.equal(basis[3],0xffffffff);assert.equal(basis[4+n],0xffffffff);
});
