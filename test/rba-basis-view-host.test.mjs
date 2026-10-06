import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {prepareLazySmpConnect4Rba32,runLazySmpConnect4Rba32} from '../addons/rba-connect4-lazy-smp-host.mjs';
const options=()=>({geometry:prepareConnect4RbaGeometry({columns:4,rows:3}),workers:4,workerMode:'minimal',sharedCacheCapacity:4096,localCacheCapacity:4096,timeoutMs:10000,supportBasisPlanBudgetBytes:8*2**20,supportClosurePlan:true,supportReflectionPlan:true,supportBasisViews:true});

test('complete view preparation admits all four workers without position work',async()=>{
 const p=await prepareLazySmpConnect4Rba32(options());
 try{assert.equal(p.state().basisViews,true);assert.equal(p.state().readyWorkers,4);assert.equal(p.state().searchStarted,false);
 const r=await p.solve([0]);assert.equal(r.basisViews,true);assert.equal(r.status,'EXACT');assert.equal(r.readyWorkers,4);assert.equal(r.workersExited,4);assert.equal(r.cleanup,true);assert.ok(r.move>=0&&r.move<4);}
 finally{await p.close();}
});

test('basis-view admission falls back cleanly when complete plans are absent',async()=>{
 const r=await runLazySmpConnect4Rba32([],{...options(),geometry:prepareConnect4RbaGeometry({columns:3,rows:3}),supportBasisPlanBudgetBytes:0});
 assert.equal(r.basisViews,false);assert.equal(r.status,'EXACT');assert.equal(r.rootWdl,0);assert.equal(r.workersExited,4);assert.equal(r.cleanup,true);
});

test('view option rejects non-Boolean and legacy requests before execution',async()=>{
 await assert.rejects(runLazySmpConnect4Rba32([],{...options(),supportBasisViews:'yes'}),/view|boolean/i);
 await assert.rejects(runLazySmpConnect4Rba32([],{...options(),workerMode:'legacy'}),/view|minimal/i);
});

test('view worker preserves first-win and full-board roots without a basis read',async()=>{
 for(const moves of [[0,0,1,1,2,2,3],[0,0,0,1,1,1,2,2,2,3,3,3]]){
 const r=await runLazySmpConnect4Rba32(moves,options());assert.equal(r.basisViews,true);assert.equal(r.status,'EXACT');assert.equal(r.move,-1);assert.equal(r.rootWdl,moves.length===7?1:0);assert.equal(r.cleanup,true);assert.equal(r.workersExited,4);
 }
});
