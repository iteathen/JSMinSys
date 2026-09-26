import test from 'node:test';
import assert from 'node:assert/strict';
import {createConnect4RbaSharedExactCache32,storeConnect4RbaSharedExactCache32} from '../../addons/rba-connect4-shared-exact-cache.mjs';

test('proof cache observation ignores unpublished rows and never mutates the TT',async()=>{
  const {observeProofCache}=await import('./policies.mjs');
  const cache=createConnect4RbaSharedExactCache32({capacity:8,keyWords:5});
  storeConnect4RbaSharedExactCache32(cache,new Uint32Array([1,2,1,2,0]),0,2);
  const before=[...cache.stats];
  assert.deepEqual(observeProofCache(cache,4,16),{occupied:1,useful:1,sampled:8,minRank:6});
  assert.deepEqual([...cache.stats],before);
  for(let i=0;i<8;i++)if(cache.sequence[i])cache.sequence[i]|=1;
  assert.equal(observeProofCache(cache,4,16).occupied,0);
});

test('anchor remains live while helper harvesting and retirement are persistent',async()=>{
  const {policyFlags,advancePolicy}=await import('./policies.mjs');
  const s={harvested:false,retired:false};
  const d={workers:2,columns:7};
  const initial=policyFlags('harvest',1,d,s);
  assert.equal((initial>>>6)&15,4);
  advancePolicy(s,{stores:300,useful:2});
  assert.equal((policyFlags('harvest',1,d,s)>>>6)&15,0);
  assert.equal(policyFlags('seed-retire',1,d,s)&1,1);
  assert.equal(policyFlags('seed-retire',0,d,s)&1,0);
  advancePolicy(s,{stores:0,useful:0});
  assert.equal(policyFlags('seed-retire',1,d,s)&1,1);
  assert.equal(policyFlags('wide-private',1,d,s),policyFlags('anchor-private',1,d,s)|(1024|(2<<1)));
});
