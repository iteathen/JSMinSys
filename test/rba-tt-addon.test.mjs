import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRbaTt32,rbaTtEnter32,rbaTtLeave32,rbaTtIntern32,rbaTtSetRoot32,
  rbaTtEnqueue32,rbaTtTake32,rbaTtPublishPrepared32,rbaTtPublishSurplus32,rbaTtAttachDependencies32,
  rbaTtSetExact32,rbaTtReconcile32,rbaTtTakeEvent32,rbaTtSignalParents32,
  rbaTtDetachDependencies32,rbaTtRelease32,rbaTtRecycle32,rbaTtMarkDone32,
  RBA_TT_ROOT,RBA_TT_ROOT_GENERATION,RBA_TT_DONE,RBA_TT_LOCK,RBA_TT_EVENT_COUNT,RBA_TT_PHASE_PENDING_ATTACH,
  RBA_TT_PHASE_ATTACHED,RBA_TT_EXECUTION_FREE,
} from '../addons/rba-tt32.mjs';

function table(){return createRbaTt32({capacity:32,bucketCount:32,keyWords:27,basisCapacity:238,edgeCapacity:10});}
function key(rank,tag){const q=new Uint32Array(27);q[0]=tag;q[10]=rank<<2;q[11]=tag+1;q[19]=tag+2;return q;}
function basis(seed,n=12){return Uint32Array.from({length:n},(_,i)=>seed+i);}

test('configured RBA TT carries key/basis/edge dimensions above 7x6 specialization',()=>{
  const t=table();assert.equal(t.keyWords,27);assert.equal(t.basisCapacity,238);assert.equal(t.edgeCapacity,10);
  const a=key(3,7),b=basis(20),q=rbaTtIntern32(t,a,0,b,0,b.length),hit=rbaTtIntern32(t,a,0,b,0,b.length);
  assert.equal(hit,q);assert.equal(t.refs[q],2);assert.equal(t.basisSize[q],12);
  assert.deepEqual([...t.basis.slice(q*238,q*238+12)],[20,21,22,23,24,25,26,27,28,29,30,31]);
  rbaTtSetRoot32(t,q);assert.equal(t.control[RBA_TT_ROOT],q);assert.equal(t.control[RBA_TT_ROOT_GENERATION],t.generation[q]);
});

test('configured ready queue establishes execution ownership',()=>{
  const t=table(),q=rbaTtIntern32(t,key(1,1),0,basis(1),0,12);
  assert.equal(rbaTtEnqueue32(t,q),1);assert.equal(rbaTtTake32(t,9),q);assert.equal(t.execution[q],9);
});

test('configured branch publication supports ten dependency slots',()=>{
  const t=table(),root=rbaTtIntern32(t,key(1,1),0,basis(1),0,12);rbaTtEnqueue32(t,root);rbaTtTake32(t,7);
  const count=10,keys=new Uint32Array(count*27),bs=new Uint32Array(count*238),sizes=new Uint32Array(count),labels=new Uint32Array(count),lo=new Uint32Array(count),hi=new Uint32Array(count),present=new Uint32Array(count);
  for(let i=0;i<count;i++){keys.set(key(2,i+2),i*27);bs.set(basis(i*20),i*238);sizes[i]=12;labels[i]=i;lo[i]=1;hi[i]=3;present[i]=1;}
  const next=rbaTtPublishPrepared32(t,root,7,1,3,keys,0,bs,0,238,sizes,labels,lo,hi,present,count);
  assert.ok(next>=0);assert.equal(t.execution[root],RBA_TT_EXECUTION_FREE);assert.equal(t.phase[root],RBA_TT_PHASE_PENDING_ATTACH);assert.equal(t.count[root],10);
  assert.equal(rbaTtAttachDependencies32(t,root),1);assert.equal(t.phase[root],RBA_TT_PHASE_ATTACHED);
});

test('fresh surplus rows install validated bounds without child pre-attachment events',()=>{
  const t=table(),root=rbaTtIntern32(t,key(0,1),0,basis(1),0,12);
  rbaTtEnqueue32(t,root);rbaTtTake32(t,7);
  const count=2,keys=new Uint32Array(count*27),bs=new Uint32Array(count*238),
    sizes=Uint32Array.from([12,12]),labels=Uint32Array.from([0,1]),
    lo=Uint32Array.from([2,1]),hi=Uint32Array.from([2,3]),
    present=Uint32Array.from([1,1]),priorities=Int32Array.from([2,1]);
  keys.set(key(1,2),0);keys.set(key(1,3),27);
  bs.set(basis(10),0);bs.set(basis(30),238);
  rbaTtPublishSurplus32(t,root,7,1,3,keys,0,bs,0,238,sizes,labels,lo,hi,present,priorities,count);
  const c0=t.child[root*10],c1=t.child[root*10+1];
  assert.ok(c0>=0&&c1>=0);
  assert.equal(t.lower[c0],2);assert.equal(t.upper[c0],2);assert.equal(t.exact[c0],2);
  assert.equal(t.lower[c1],1);assert.equal(t.upper[c1],3);assert.equal(t.exact[c1],0);
  assert.equal(t.control[RBA_TT_EVENT_COUNT],1,'only the parent pending-attach event should be queued');
});

test('configured Bellman reconciliation propagates exact child evidence',()=>{
  const t=table(),root=rbaTtIntern32(t,key(0,1),0,basis(1),0,12);rbaTtEnqueue32(t,root);rbaTtTake32(t,7);
  const count=2,keys=new Uint32Array(count*27),bs=new Uint32Array(count*238),sizes=Uint32Array.from([12,12]),labels=Uint32Array.from([0,9]),lo=Uint32Array.from([1,1]),hi=Uint32Array.from([3,3]),present=Uint32Array.from([1,1]);
  keys.set(key(1,2),0);keys.set(key(1,3),27);bs.set(basis(10),0);bs.set(basis(30),238);
  rbaTtPublishPrepared32(t,root,7,1,3,keys,0,bs,0,238,sizes,labels,lo,hi,present,count);rbaTtAttachDependencies32(t,root);
  const c0=t.child[root*10],c1=t.child[root*10+1];rbaTtSetExact32(t,c0,3);rbaTtSetExact32(t,c1,2);
  assert.equal(rbaTtReconcile32(t,root,0),3);assert.equal(t.exact[root],3);
});

test('configured event coalescing, detach and recycle preserve pins',()=>{
  const t=table(),root=rbaTtIntern32(t,key(0,1),0,basis(1),0,12);rbaTtEnqueue32(t,root);rbaTtTake32(t,5);
  const keys=new Uint32Array(27);keys.set(key(1,2));const bs=new Uint32Array(238);bs.set(basis(10));
  const sizes=Uint32Array.from([12]),labels=Uint32Array.from([9]),lo=Uint32Array.from([1]),hi=Uint32Array.from([3]),present=Uint32Array.from([1]);
  const retained=rbaTtPublishPrepared32(t,root,5,1,3,keys,0,bs,0,238,sizes,labels,lo,hi,present,1);assert.ok(retained>=0);rbaTtAttachDependencies32(t,root);
  const child=t.child[root*10],generation=t.generation[child];assert.equal(rbaTtTakeEvent32(t),root);assert.equal(rbaTtSignalParents32(t,child),1);assert.equal(rbaTtTakeEvent32(t),root);
  assert.equal(rbaTtDetachDependencies32(t,root),1);assert.equal(t.parentHead[child],-1);t.execution[child]=0;rbaTtRelease32(t,child,generation);rbaTtRecycle32(t,child);assert.equal(t.live[child],0);
});

test('configured TT transaction and DONE controls remain geometry-neutral',()=>{
  const t=table();assert.equal(rbaTtEnter32(t,17),1);assert.equal(rbaTtEnter32(t,18),0);rbaTtLeave32(t);assert.equal(rbaTtEnter32(t,18),1);rbaTtLeave32(t);
  assert.equal(rbaTtMarkDone32(t),1);assert.equal(Atomics.load(t.control,RBA_TT_DONE),1);
});


test('contended TT enter avoids a locked RMW when the lock is visibly held',()=>{
  const t=table(),originalCompareExchange=Atomics.compareExchange;
  let rmwCalls=0;
  Atomics.store(t.control,RBA_TT_LOCK,99);
  Atomics.compareExchange=(...args)=>{
    rmwCalls+=1;
    return originalCompareExchange(...args);
  };
  try{
    assert.equal(rbaTtEnter32(t,17),0);
    assert.equal(rmwCalls,0);
  }finally{
    Atomics.compareExchange=originalCompareExchange;
    Atomics.store(t.control,RBA_TT_LOCK,0);
  }
});
