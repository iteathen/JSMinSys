import test from 'node:test';
import assert from 'node:assert/strict';

test('strategy decisions use persistent flag actions without stopping the anchor',async()=>{
  const {actionPolicyFlags,advanceActionPolicy,ACTION_POLICIES}=await import('./action-policies.mjs');
  const state={reuseSeen:false};
  assert.equal(actionPolicyFlags('action-share-on-reuse',1,state)&4096,4096);
  advanceActionPolicy(state,{hits:64});
  assert.equal(actionPolicyFlags('action-share-on-reuse',1,state)&4096,0);
  advanceActionPolicy(state,{hits:0});assert.equal(state.reuseSeen,true);
  assert.equal(actionPolicyFlags('action-proof-on-reuse',0,state)&8192,8192);
  assert.equal(actionPolicyFlags('action-proof-helper',0,state)&8192,0);
  assert.equal(actionPolicyFlags('action-proof-helper',1,state)&8192,8192);
  assert.equal(actionPolicyFlags('action-proof-private',1,state)&12288,12288);
  assert.equal(actionPolicyFlags('action-reverse-proof',1,state)&24576,24576);
  assert.equal(actionPolicyFlags('action-proof-sample8',0,state),8192|2048|(3<<6));
  for(const name of ACTION_POLICIES)for(let worker=0;worker<4;worker++)assert.equal(actionPolicyFlags(name,worker,state)&1,0);
  assert.throws(()=>actionPolicyFlags('invalid',0,state),/policy/);
});
