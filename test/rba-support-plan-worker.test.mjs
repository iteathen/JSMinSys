import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {prepareSupportBasisPlans32} from '../addons/rba-connect4-support-basis-plan.mjs';

test('auxiliary worker preserves native flag inheritance and removes only its search-affinity preload',async()=>{
 const {filterSupportWorkerExecArgv32:f}=await import('../addons/rba-connect4-support-plan-host.mjs'),
  preload=new URL('../tools/worker-affinity-preload.mjs',import.meta.url).href;
 assert.equal(f(['--use-largepages=off']),undefined);
 assert.deepEqual(f(['--experimental-ffi','--import',preload,'--import','startup.mjs']),['--experimental-ffi','--import','startup.mjs']);
 assert.deepEqual(f(['--input-type=module','--experimental-ffi','--import',preload]),['--experimental-ffi']);
});

test('cold support worker returns complete byte-identical tables and exits before handoff',async()=>{
 const {prepareSupportBasisPlansWorker32}=await import('../addons/rba-connect4-support-plan-host.mjs');
 for(const [columns,rows,budget] of [[1,4,8*2**20],[4,1,8*2**20],[4,4,8*2**20],[6,4,8*2**20],[10,10,1]]){
  const g=prepareConnect4RbaGeometry({columns,rows}),expected=prepareSupportBasisPlans32(g,budget,true,true),
   {plan,execution}=await prepareSupportBasisPlansWorker32(g,budget,true,true);
  assert.equal(execution.workerExited,true);assert.equal(execution.exitCode,0);assert.equal(execution.actual,null);
  assert.deepEqual(plan,expected);if(plan){assert.ok(Object.isFrozen(plan));assert.ok(plan.basis.buffer instanceof SharedArrayBuffer);}
 }
});

test('cold support worker honors cancellation, deadlines and invalid input without silent fallback',async()=>{
 const {prepareSupportBasisPlansWorker32}=await import('../addons/rba-connect4-support-plan-host.mjs'),g=prepareConnect4RbaGeometry({columns:4,rows:4});
 await assert.rejects(prepareSupportBasisPlansWorker32(g,8*2**20,true,true,{timeoutMs:0}),/invalid support-worker timeout/);
 await assert.rejects(prepareSupportBasisPlansWorker32(g,8*2**20,true,true,{target:{group:0,processor:-1}}),/invalid support-worker target/);
 const stopped=new AbortController();stopped.abort();
 await assert.rejects(prepareSupportBasisPlansWorker32(g,8*2**20,true,true,{signal:stopped.signal}),/aborted/);
 const running=new AbortController(),pending=prepareSupportBasisPlansWorker32(g,8*2**20,true,true,{signal:running.signal});running.abort();
 await assert.rejects(pending,/aborted/);
 await assert.rejects(prepareSupportBasisPlansWorker32(g,8*2**20,true,true,{timeoutMs:1}),/deadline/);
 await assert.rejects(prepareSupportBasisPlansWorker32(g,-1,true,true),/invalid support-plan budget/);
 const long=await prepareSupportBasisPlansWorker32(g,8*2**20,true,true,{timeoutMs:2147483648});
 assert.equal(long.execution.exitCode,0,'long deadline must not clamp to1ms');
});
