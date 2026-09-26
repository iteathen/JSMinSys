import test from 'node:test';
import assert from 'node:assert/strict';

test('asynchronous strategist and evaluators agree and join with live controls',{timeout:15000},async()=>{
  const {runTrial}=await import('./host.mjs');
  for(const policy of ['inert','rotate','adaptive','combined']){
    const r=await runTrial({fixture:{columns:4,rows:4,moves:[]},workers:2,policy,cadenceMs:1,timeoutMs:2000,warmups:2});
    assert.equal(r.status,'EXACT');assert.equal(r.value,2);assert.equal(r.cleanup,true);
    assert.equal(r.evaluators.length,2);assert.equal(r.strategist.error,undefined);
    assert.ok(r.evaluators.every(w=>w.result.value===2||w.result.status==='CANCELLED'));
    if(policy!=='inert')assert.ok(r.evaluators.some(w=>w.changes>0));
  }
});

test('deadline plus delayed instructions never fabricates a result or leaks threads',{timeout:15000},async()=>{
  const {runTrial}=await import('./host.mjs');
  const r=await runTrial({fixture:{columns:7,rows:6,moves:[]},workers:2,policy:'rotate',cadenceMs:30,timeoutMs:10,warmups:0});
  assert.equal(r.status,'TIMEOUT');assert.equal(r.value,null);assert.equal(r.cleanup,true);
  assert.ok(r.evaluators.every(w=>w.result.status==='CANCELLED'));
  const fresh=await runTrial({fixture:{columns:4,rows:4,moves:[]},workers:2,policy:'inert',timeoutMs:2000,warmups:0});
  assert.equal(fresh.status,'EXACT');assert.equal(fresh.value,2);
});
