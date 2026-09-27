import test from 'node:test';
import assert from 'node:assert/strict';

test('width delta, not elapsed time or absolute width, selects the mode',async()=>{
  const {createWidthPolicy,advanceWidthPolicy}=await import('./width-policy.mjs');
  const p=createWidthPolicy();
  const sample=(revision,width)=>({complete:true,scope:7,revision,width});
  assert.equal(advanceWidthPolicy(p,sample(1,1)),0);
  assert.notEqual(advanceWidthPolicy(p,sample(2,4)),0);
  assert.equal(p.delta,3);
  assert.notEqual(advanceWidthPolicy(p,sample(3,4)),0,'flat width holds mode');
  assert.equal(advanceWidthPolicy(p,sample(4,2)),0);
  assert.notEqual(advanceWidthPolicy(p,sample(5,5)),0,'re-expansion re-enters shallow');
  assert.equal(advanceWidthPolicy(p,sample(6,0)),0);
});

test('incomplete, duplicate, stale and changed-scope observations cannot fabricate a delta',async()=>{
  const {createWidthPolicy,advanceWidthPolicy}=await import('./width-policy.mjs');
  const p=createWidthPolicy();
  advanceWidthPolicy(p,{complete:true,scope:1,revision:1,width:1});
  const shallow=advanceWidthPolicy(p,{complete:true,scope:1,revision:2,width:4});
  for(const sample of [{complete:false,scope:1,revision:3,width:0},
    {complete:true,scope:1,revision:2,width:0},{complete:true,scope:1,revision:1,width:0}]){
    assert.equal(advanceWidthPolicy(p,sample),shallow);assert.equal(p.width,4);
  }
  assert.equal(advanceWidthPolicy(p,{complete:true,scope:2,revision:1,width:100}),0);
  assert.equal(p.delta,0);
  assert.throws(()=>advanceWidthPolicy(p,{complete:true,scope:2,revision:2,width:-1}));
});

test('relative expansion filter is independent of observation time',async()=>{
  const {createWidthPolicy,advanceWidthPolicy}=await import('./width-policy.mjs');
  const p=createWidthPolicy({growthPercent:25});
  advanceWidthPolicy(p,{complete:true,scope:1,revision:1,width:100});
  assert.equal(advanceWidthPolicy(p,{complete:true,scope:1,revision:2,width:103}),0);
  assert.notEqual(advanceWidthPolicy(p,{complete:true,scope:1,revision:3,width:140}),0);
});

test('real strategist derives complete widths and supplies mode changes without evaluator observation',{timeout:15000},async()=>{
  process.env.JSMINSYS_STRATEGIST_POLICY='modes-width-delta';
  try{
    const {runTrial}=await import('./host.mjs');
    const r=await runTrial({fixture:{columns:7,rows:6,moves:[]},workers:1,policy:'inert',timeoutMs:150,warmups:0,cadenceMs:1});
    assert.equal(r.status,'TIMEOUT');assert.equal(r.value,null);assert.equal(r.cleanup,true);
    assert.equal(r.forcedTerminations,0);assert.deepEqual(r.errors,[]);
    assert.ok(r.strategist.widthObserver.generated>0);
    assert.ok(r.strategist.trace.some(t=>t.width.complete&&t.width.delta>0&&(t.flags[0]&2)));
    assert.ok(r.evaluators[0].changes>0);
  }finally{delete process.env.JSMINSYS_STRATEGIST_POLICY;}
});
