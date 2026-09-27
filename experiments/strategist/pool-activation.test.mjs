import test from 'node:test';
import assert from 'node:assert/strict';

test('pool activation requires fresh sustained expansion and admits one standby at a time',async()=>{
  const {createPoolPolicy,advancePoolPolicy}=await import('./pool-policy.mjs');
  const p=createPoolPolicy(4,1);
  const s=(revision,width)=>({revision,width,mode:0,horizonStops:0,scope:1,nodes:revision*10});
  assert.equal(advancePoolPolicy(p,[s(2,5)]),-1);
  assert.equal(advancePoolPolicy(p,[s(4,7)]),-1);
  assert.equal(advancePoolPolicy(p,[s(4,20)]),-1);
  assert.equal(advancePoolPolicy(p,[s(6,9)]),1);assert.equal(p.active,2);
  assert.equal(advancePoolPolicy(p,[null,s(2,5)]),-1);
  assert.equal(advancePoolPolicy(p,[null,s(4,7)]),-1);
  assert.equal(advancePoolPolicy(p,[null,s(6,9)]),2);assert.equal(p.active,3);
  assert.equal(advancePoolPolicy(p,[s(8,11)]),-1);
  assert.equal(advancePoolPolicy(p,[s(10,13)]),3);assert.equal(p.active,4);
  assert.equal(advancePoolPolicy(p,[s(12,30)]),-1,'prepared capacity is a hard bound');
});

test('prepared standby workers stay idle and stop without entering search',{timeout:15000},async()=>{
  process.env.JSMINSYS_STRATEGIST_POLICY='modes-pending-pool-fixed';
  try{
    const {runTrial}=await import('./host.mjs');
    const r=await runTrial({fixture:{columns:4,rows:4,moves:[]},workers:3,initialActive:1,policy:'inert',timeoutMs:1000,warmups:0});
    assert.equal(r.status,'EXACT');assert.equal(r.cleanup,true);assert.deepEqual(r.errors,[]);
    assert.equal(r.evaluators.filter(e=>e.activated).length,1);
    for(const e of r.evaluators.slice(1)){assert.equal(e.result.status,'NOT_STARTED');assert.equal(e.result.metrics.nodes,0);}
  }finally{delete process.env.JSMINSYS_STRATEGIST_POLICY;}
});

test('strategist activates preinitialized workers through flags and timeout wakes any remaining standby',{timeout:15000},async()=>{
  process.env.JSMINSYS_STRATEGIST_POLICY='modes-pending-pool-grow';
  try{
    const {runTrial}=await import('./host.mjs');
    const r=await runTrial({fixture:{columns:7,rows:6,moves:[]},workers:4,initialActive:1,policy:'inert',timeoutMs:500,warmups:0,cadenceMs:1});
    assert.equal(r.status,'TIMEOUT');assert.equal(r.cleanup,true);assert.deepEqual(r.errors,[]);
    assert.ok(r.strategist.pool.active>1);assert.ok(r.evaluators.filter(e=>e.activated).length>1);
    assert.ok(r.strategist.trace.every(t=>t.flags.every(f=>(f&2)===0)),'activation does not change search mode');
  }finally{delete process.env.JSMINSYS_STRATEGIST_POLICY;}
});
