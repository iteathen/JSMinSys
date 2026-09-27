import test from 'node:test';
import assert from 'node:assert/strict';
import {modePolicyFlags,MODE_POLICIES} from './mode-policy.mjs';
import {encodeSearchMode} from './mode-controls.mjs';
import {runTrial} from './host.mjs';

test('fixed mixed policies assign exactly one shallow worker without timed switching',()=>{
  for(const [name,wide] of [['modes-wide-helper',1],['modes-wide-anchor',0]]){
    assert.ok(MODE_POLICIES.includes(name));
    for(const time of [0,5,5000])for(let worker=0;worker<2;worker++)
      assert.equal(modePolicyFlags(name,time,worker),worker===wide?encodeSearchMode({shallow:true,stride:2}):0);
  }
});

test('mixed shallow/deep workers receive distinct commands and stop cleanly',{timeout:15000},async()=>{
  const prior=process.env.JSMINSYS_STRATEGIST_POLICY;
  try{
    for(const [policy,wide] of [['modes-wide-helper',1],['modes-wide-anchor',0]]){
      process.env.JSMINSYS_STRATEGIST_POLICY=policy;
      const r=await runTrial({fixture:{columns:7,rows:6,moves:[]},workers:2,policy:'inert',
        timeoutMs:100,warmups:0,measureCycles:false});
      assert.equal(r.status,'TIMEOUT');assert.equal(r.value,null);assert.equal(r.cleanup,true);
      assert.equal(r.forcedTerminations,0);assert.deepEqual(r.errors,[]);
      assert.ok(r.evaluators[wide].result.metrics.horizonStops>0);
      assert.equal(r.evaluators[wide^1].result.metrics.horizonStops,0);
      assert.ok(r.strategist.trace.some(t=>(t.flags[wide]&2)!==0&&(t.flags[wide^1]&2)===0));
    }
  }finally{if(prior===undefined)delete process.env.JSMINSYS_STRATEGIST_POLICY;else process.env.JSMINSYS_STRATEGIST_POLICY=prior;}
});
