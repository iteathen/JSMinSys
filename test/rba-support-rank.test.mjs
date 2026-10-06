import test from 'node:test';import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {prepareSupportBasisPlans32} from '../addons/rba-connect4-support-basis-plan.mjs';
import {prepareSupportRankQuery32,findSupportRankSlot32} from '../addons/rba-connect4-support-rank-query.mjs';
import {prepareLazySmpConnect4Rba32} from '../addons/rba-connect4-lazy-smp-host.mjs';

test('cold rank membership and native prefixes give exact sorted slots with bounded budget',()=>{
 let checks=0;
 for(const [columns,rows] of [[1,4],[4,1],[3,4],[4,3],[4,4]]){
  const g=prepareConnect4RbaGeometry({columns,rows}),plan=prepareSupportBasisPlans32(g,16*2**20,true,true);
  const bytes=plan.profiles*g.shapeWordCount*(4+(g.maxBasis<=255?1:g.maxBasis<=65535?2:4)),budget=plan.workingBytes+bytes;
  assert.equal(prepareSupportRankQuery32(g,plan,budget-1),null);
  const rank=prepareSupportRankQuery32(g,plan,budget);assert.ok(rank);
  assert.equal(rank.bytes,plan.bytes+bytes);assert.equal(rank.workingBytes,budget);assert.equal(rank.basis,plan.basis);assert.equal(rank.closures,plan.closures);assert.equal(plan.rankMembership,undefined);
  for(let h=0;h<plan.profiles;h++)for(let slot=0;slot<plan.sizes[h];slot++){
   const id=plan.basis[h*g.maxBasis+slot];
   assert.equal(findSupportRankSlot32(rank.rankMembership,rank.rankPrefix,h*g.shapeWordCount,id),slot);checks++;
  }
 }
 // Bit0/bit31 and all-bits word exercise a mask that must never include image.
 for(const Prefix of [Uint8Array,Uint16Array,Uint32Array])for(let bit=0;bit<32;bit++)
  assert.equal(findSupportRankSlot32(new Uint32Array([0xffffffff]),new Prefix([7]),0,bit),7+bit);
 assert.throws(()=>prepareSupportRankQuery32({},null,-1),/budget/);
 console.log(JSON.stringify({checks}));
});
test('four-worker cold admission selects rank only when its complete budget fits',async()=>{
 const g=prepareConnect4RbaGeometry({columns:4,rows:3}),plan=prepareSupportBasisPlans32(g,8*2**20,true,true),extra=plan.profiles*g.shapeWordCount*5;
 for(const ranked of [false,true]){
  const p=await prepareLazySmpConnect4Rba32({geometry:g,workers:4,sharedCacheCapacity:16,localCacheCapacity:16,timeoutMs:5000,
   supportBasisPlanBudgetBytes:plan.workingBytes+(ranked?extra:0),supportClosurePlan:true,supportReflectionPlan:true,supportBasisViews:true});
  try{
   const state=p.state();assert.equal(state.readyWorkers,4);assert.equal(state.searchStarted,false);assert.equal(state.basisViews,true);assert.equal(state.rankQuery,ranked);assert.equal(state.supportRankQueryBytes,ranked?extra:0);
   const r=await p.solve([0]);assert.equal(r.rankQuery,ranked);assert.equal(r.status,'EXACT');assert.equal(r.cleanup,true);assert.equal(r.workersExited,4);assert.equal(r.supportBasisPlanBytes,plan.bytes+(ranked?extra:0));
  }finally{await p.close();}
 }
});
