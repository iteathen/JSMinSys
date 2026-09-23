import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRbaTt8x32,
  rbaTtEnter32,
  rbaTtLeave32,
  rbaTtIntern8x32,
  rbaTtSetRoot32,
  rbaTtEnqueue32,
  rbaTtTake32,
  rbaTtPublishPrepared7x32,
  rbaTtAttachDependencies7x32,
  rbaTtSetExact32,
  rbaTtReconcile7x32,
  rbaTtEnqueueDependencies7x32,
  rbaTtSignalParents32,
  rbaTtTakeEvent32,
  rbaTtDetachDependencies7x32,
  rbaTtRelease32,
  rbaTtRecycle32,
  rbaTtMarkDone32,
  RBA_TT_ROOT,
  RBA_TT_ROOT_GENERATION,
  RBA_TT_DONE,
  RBA_TT_PHASE_PENDING_ATTACH,
  RBA_TT_PHASE_ATTACHED,
  RBA_TT_EXECUTION_FREE,
} from '../addons/rba-tt8x32.mjs';

function key(rank, tag) {
  const q=new Uint32Array(8);
  q[0]=(rank<<21)|tag;
  q[2]=tag+1;q[5]=tag+2;
  return q;
}
function basis(seed,n=4){
  return Uint32Array.from({length:n},(_,i)=>seed+i);
}

test('RBA TT interns exact eight-word q once and carries immutable derived basis',()=>{
  const t=createRbaTt8x32(8,8),a=key(3,7),b=basis(20);
  const q=rbaTtIntern8x32(t,a,0,b,0,b.length);
  const hit=rbaTtIntern8x32(t,a,0,b,0,b.length);
  assert.equal(hit,q);assert.equal(t.refs[q],2);assert.equal(t.basisSize[q],4);
  assert.deepEqual([...t.basis.slice(q*69,q*69+4)],[20,21,22,23]);
  rbaTtSetRoot32(t,q);
  assert.equal(t.control[RBA_TT_ROOT],q);assert.equal(t.control[RBA_TT_ROOT_GENERATION],t.generation[q]);
});

test('RBA TT ready queue establishes execution ownership without reconstructing q',()=>{
  const t=createRbaTt8x32(8,8),q=rbaTtIntern8x32(t,key(1,1),0,basis(1),0,4);
  assert.equal(rbaTtEnqueue32(t,q),1);
  assert.equal(rbaTtTake32(t,9),q);assert.equal(t.execution[q],9);
  assert.equal(t.keys[q*8]>>>21,1);assert.equal(t.basisSize[q],4);
});

test('prepared branch publication interns children, retains one locally, then attaches exact topology',()=>{
  const t=createRbaTt8x32(16,16),root=rbaTtIntern8x32(t,key(1,1),0,basis(1),0,4);
  rbaTtEnqueue32(t,root);assert.equal(rbaTtTake32(t,7),root);
  const keys=new Uint32Array(16);keys.set(key(2,2),0);keys.set(key(2,3),8);
  const bs=new Uint32Array(2*69);bs.set(basis(10),0);bs.set(basis(30),69);
  const sizes=Uint32Array.from([4,4]),labels=Uint32Array.from([3,4]),lo=Uint32Array.from([1,1]),hi=Uint32Array.from([3,3]);
  const next=rbaTtPublishPrepared7x32(t,root,7,1,3,keys,0,bs,0,69,sizes,labels,lo,hi,3,2);
  assert.ok(next>=0);assert.equal(t.execution[root],RBA_TT_EXECUTION_FREE);
  assert.equal(t.phase[root],RBA_TT_PHASE_PENDING_ATTACH);assert.equal(t.count[root],2);
  assert.equal(t.execution[next],7);
  assert.equal(rbaTtAttachDependencies7x32(t,root),1);assert.equal(t.phase[root],RBA_TT_PHASE_ATTACHED);
  const e=root*7;assert.ok(t.child[e]>=0);assert.ok(t.child[e+1]>=0);
  assert.equal(t.parentHead[t.child[e]]>=0,true);
});

test('generic Bellman reconciliation propagates exact child evidence and releases no-longer-needed pins',()=>{
  const t=createRbaTt8x32(16,16),root=rbaTtIntern8x32(t,key(0,1),0,basis(1),0,4);
  rbaTtEnqueue32(t,root);rbaTtTake32(t,7);
  const keys=new Uint32Array(16);keys.set(key(1,2),0);keys.set(key(1,3),8);
  const bs=new Uint32Array(138);bs.set(basis(10),0);bs.set(basis(30),69);
  const sizes=Uint32Array.from([4,4]),labels=Uint32Array.from([0,1]),lo=Uint32Array.from([1,1]),hi=Uint32Array.from([3,3]);
  rbaTtPublishPrepared7x32(t,root,7,1,3,keys,0,bs,0,69,sizes,labels,lo,hi,3,2);
  rbaTtAttachDependencies7x32(t,root);
  const c0=t.child[root*7],c1=t.child[root*7+1];
  rbaTtSetExact32(t,c0,3);rbaTtSetExact32(t,c1,2);
  assert.equal(rbaTtReconcile7x32(t,root,0),3);
  assert.equal(t.exact[root],3);assert.equal(t.lower[root],3);assert.equal(t.upper[root],3);
  assert.equal(t.child[root*7],-1);assert.equal(t.child[root*7+1],-1);
});

test('dependency queue, parent signaling, detach and recycle preserve generations and pins',()=>{
  const t=createRbaTt8x32(8,8),root=rbaTtIntern8x32(t,key(0,1),0,basis(1),0,4);
  rbaTtEnqueue32(t,root);rbaTtTake32(t,5);
  const keys=new Uint32Array(8);keys.set(key(1,2));
  const bs=new Uint32Array(69);bs.set(basis(10));
  const sizes=Uint32Array.from([4]),labels=Uint32Array.from([0]),lo=Uint32Array.from([1]),hi=Uint32Array.from([3]);
  const retained=rbaTtPublishPrepared7x32(t,root,5,1,3,keys,0,bs,0,69,sizes,labels,lo,hi,1,1);
  assert.ok(retained>=0);rbaTtAttachDependencies7x32(t,root);
  const child=t.child[root*7],generation=t.generation[child];
  // Branch publication already coalesced one parent event. Consume it so a
  // subsequent child update must publish a fresh parent event.
  assert.equal(rbaTtTakeEvent32(t),root);
  // Retained child is already owned, so enqueue does not duplicate it.
  assert.equal(rbaTtEnqueueDependencies7x32(t,root),0);
  assert.equal(rbaTtSignalParents32(t,child),1);
  assert.equal(rbaTtTakeEvent32(t),root);
  assert.equal(rbaTtDetachDependencies7x32(t,root),1);
  assert.equal(t.parentHead[child],-1);
  t.execution[child]=0;
  rbaTtRelease32(t,child,generation);
  rbaTtRecycle32(t,child);
  assert.equal(t.live[child],0);
});

test('DONE publication uses shared control without domain result semantics',()=>{
  const t=createRbaTt8x32(2,2);
  assert.equal(rbaTtMarkDone32(t),1);assert.equal(Atomics.load(t.control,RBA_TT_DONE),1);
});

test('table transaction helpers serialize shared mutations',()=>{
  const t=createRbaTt8x32(2,2);
  assert.equal(rbaTtEnter32(t,17),1);
  assert.equal(rbaTtEnter32(t,18),0);
  rbaTtLeave32(t);
  assert.equal(rbaTtEnter32(t,18),1);
  rbaTtLeave32(t);
});
