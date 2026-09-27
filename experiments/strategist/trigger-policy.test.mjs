import test from 'node:test';
import assert from 'node:assert/strict';
import {createPendingPolicy,advancePendingPolicy} from './pending-policy.mjs';

const sample=(revision,width,frames=4,extra={})=>({revision,scope:1,mode:0,width,frames,
  horizonStops:0,completedBands:0,bandCompleted:0,...extra});
test('one-growth trigger acts without waiting for a second increase',()=>{
  const p=createPendingPolicy({oneBand:true,trigger:'growth'});
  assert.equal(advancePendingPolicy(p,sample(2,5)),0);
  assert.equal(advancePendingPolicy(p,sample(4,6)),522);
});
test('relative trigger requires at least 25 percent width growth',()=>{
  const p=createPendingPolicy({oneBand:true,trigger:'relative25'});
  assert.equal(advancePendingPolicy(p,sample(2,10)),0);
  assert.equal(advancePendingPolicy(p,sample(4,11)),0);
  assert.equal(advancePendingPolicy(p,sample(6,12)),0);
  assert.equal(advancePendingPolicy(p,sample(8,15)),522);
});
test('density trigger rejects growth explained by more active frames',()=>{
  const p=createPendingPolicy({oneBand:true,trigger:'density'});
  assert.equal(advancePendingPolicy(p,sample(2,5,2)),0);
  assert.equal(advancePendingPolicy(p,sample(4,9,4)),0);
  assert.equal(advancePendingPolicy(p,sample(6,13,6)),0);
  assert.equal(advancePendingPolicy(p,sample(8,17,6)),522);
});
for(const trigger of ['sustained','growth','relative25','density'])test(trigger+' preserves acknowledgement and scope guards',()=>{
  const p=createPendingPolicy({oneBand:true,trigger});
  assert.equal(advancePendingPolicy(p,sample(2,4)),0);
  assert.equal(advancePendingPolicy(p,sample(2,40)),0,'duplicate cannot trigger');
  assert.equal(advancePendingPolicy(p,sample(4,20,4,{horizonStops:1})),0,'new horizon invalidates delta');
  advancePendingPolicy(p,sample(6,30,4,{horizonStops:1}));
  assert.equal(advancePendingPolicy(p,sample(8,45,4,{horizonStops:1})),522);
  assert.equal(advancePendingPolicy(p,null),522);
  assert.equal(advancePendingPolicy(p,sample(10,50,4,{horizonStops:1})),522,'no completion yet');
  assert.equal(advancePendingPolicy(p,sample(12,5,4,{horizonStops:4,bandCompleted:1})),0);
  assert.equal(advancePendingPolicy(p,sample(14,50,4,{scope:2})),0,'fresh solve cannot inherit trigger');
});
test('unknown trigger fails closed during preparation',()=>{
  assert.throws(()=>createPendingPolicy({trigger:'typo'}),RangeError);
});
