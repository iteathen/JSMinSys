import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
const source=readFileSync(new URL('../addons/rba-connect4-prepared-session-host.mjs',import.meta.url),'utf8'),
 ledger=JSON.parse(readFileSync(new URL('../catalog/addon-cycle-ledger-v0.json',import.meta.url))),
 functionText=source.slice(source.indexOf('  function materializePreparedConnect4SearchResult32('),source.indexOf('  async function solvePreparedConnect4Search32(')),
 find=name=>ledger.units.find(u=>u.source==='addons/rba-connect4-prepared-session-host.mjs'&&u.name===name);

test('actual prepared affinity callbacks match declared loads and result objects',()=>{
 const completion=find('<prepared-completion-callback>'),affinity=find('<prepared-affinity-callback>');
 assert.ok(completion&&affinity,'both actual callbacks must have bound subledgers');
 const parent=find('materializePreparedConnect4SearchResult32');
 assert.ok(parent.operations.some(o=>o.op==='runtime.array.from'&&o.count==='1+AFFINITY'));
 assert.ok(parent.operations.some(o=>o.op==='runtime.callback'&&o.target===affinity.unit&&o.count==='W*AFFINITY'));
 for(const platform of ['win32','linux','darwin']){
  const workers=6,affinityState=new Int32Array(workers*3),control=new Int32Array([0,1,0,0,0]),
   resultWords=new Int32Array(workers*4),readyGate=new Int32Array([workers]);
  resultWords[0]=3;resultWords[2]=3;
  const loads={affinity:0,result:0,other:0};
  const context={workers,affinityState,control,resultWords,readyGate,WINNER:4,DONE:1,STRIDE:4,DEADLINE:102,CANCELLED:103,
   session:{state:()=>({errorCode:0,cleanup:true,workersExited:workers,errors:[]}),threads:Array(workers)},
   Atomics:{load:(view,index)=>{loads[view===affinityState?'affinity':view===resultWords?'result':'other']++;return Atomics.load(view,index);}},
   performance:{now:()=>0},resourceMetadata:{},initializationStarted:0,initializationFinished:0,
   solveStarted:0,solveFinished:0,cleanupStarted:0,cleanupFinished:0,started:true,
   workerTargets:Array.from({length:workers},()=>({platform}))};
  const result=runInNewContext(functionText+'materializePreparedConnect4SearchResult32()',context);
  const darwin=platform==='darwin'?1:0,
   expression=affinity.operations.find(o=>o.op==='atomic.load.u32').count,
   perWorker=runInNewContext(expression,{DARWIN:darwin});
  assert.equal(loads.affinity,perWorker*workers);
  assert.equal(result.workerAffinity.length,workers);
  assert.equal(loads.result,workers+2);
  assert.equal(affinity.operations.find(o=>o.op==='runtime.object.allocate').count,1);
 }
});
