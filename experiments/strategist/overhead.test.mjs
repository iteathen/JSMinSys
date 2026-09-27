import test from 'node:test';
import assert from 'node:assert/strict';
import {runTrial} from './host.mjs';

test('bare and host-stopped controls preserve exact traversal without a strategist',async()=>{
  delete process.env.JSMINSYS_STRATEGIST_POLICY;
  const config={fixture:{columns:4,rows:4,moves:[1]},workers:1,warmups:0,timeoutMs:1000};
  const bare=await runTrial({...config,policy:'bare'}),stop=await runTrial({...config,policy:'host-only'});
  for(const r of [bare,stop]){
    assert.equal(r.status,'EXACT');assert.equal(r.cleanup,true);assert.deepEqual(r.errors,[]);
    assert.equal(r.strategist,null);
  }
  assert.equal(bare.value,stop.value);
  assert.deepEqual(bare.evaluators[0].result.metrics,stop.evaluators[0].result.metrics);
  await assert.rejects(runTrial({...config,policy:'bare',workers:2}),/bare control requires one worker/);
});

test('fixed pool uses mode worker without observation while retaining standby STOP',async()=>{
  process.env.JSMINSYS_STRATEGIST_POLICY='modes-pool-fixed';
  try{
    const r=await runTrial({fixture:{columns:4,rows:4,moves:[1]},workers:3,initialActive:1,warmups:0,timeoutMs:1000});
    assert.equal(r.status,'EXACT');assert.equal(r.cleanup,true);assert.deepEqual(r.errors,[]);
    assert.equal(r.evaluators.filter(e=>e.activated).length,1);
    assert.equal(r.strategist.pending,undefined);
    assert.ok(r.strategist.trace.every(t=>t.flags.every(f=>!(f&256))));
    assert.equal(r.evaluators[0].result.metrics.observePublications,undefined);
    assert.ok(r.evaluators.slice(1).every(e=>e.result.status==='NOT_STARTED'));
  }finally{delete process.env.JSMINSYS_STRATEGIST_POLICY;}
});
