import test from 'node:test';import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {prepareSupportBasisPlans32} from '../addons/rba-connect4-support-basis-plan.mjs';
import {prepareSupportSearchBasisScratch32,loadSupportSearchBasisKnownHandle32,findSupportBasisSlot32} from '../addons/rba-connect4-support-search-view.mjs';

test('sorted slot lookup matches every bounded support row and retains native ID widths',()=>{
 let slots=0,profiles=0;
 for(const [columns,rows] of [[1,4],[4,1],[3,4],[4,3],[4,4]]){
  const g=prepareConnect4RbaGeometry({columns,rows});g.supportBasisPlans=prepareSupportBasisPlans32(g,16*2**20,true,true);
  const p=g.supportBasisPlans;assert.ok(p);
  for(const Id of [Uint8Array,Uint16Array,Uint32Array]){
   if(Id===Uint8Array&&g.shapeCount>256)continue;
   const ids=Id.from(p.basis);
   for(let handle=0;handle<p.profiles;handle++){
    const base=handle*g.maxBasis,n=p.sizes[handle];
    for(let slot=0;slot<n;slot++){assert.equal(findSupportBasisSlot32(ids,base,n,ids[base+slot]),slot);slots++;}
    profiles++;
   }
  }
 }
 console.log(JSON.stringify({slots,profiles}));
});
test('known search row loader touches no heights, output basis or inverse',()=>{
 const g=prepareConnect4RbaGeometry({columns:4,rows:3});g.supportBasisPlans=prepareSupportBasisPlans32(g,8*2**20,true,true);
 const scratch=prepareSupportSearchBasisScratch32(g),forbidden=new Proxy({},{get(){assert.fail('unused scratch read');},set(){assert.fail('unused scratch written');}});
 assert.deepEqual(Object.keys(scratch).sort(),['map','mirror']);
 for(const handle of [0,1,25,g.supportBasisPlans.profiles-1]){
  assert.equal(loadSupportSearchBasisKnownHandle32(g,forbidden,0,forbidden,0,forbidden,scratch.map,forbidden,handle),g.supportBasisPlans.sizes[handle]);
  assert.equal(scratch.map[0],handle);
 }
});
