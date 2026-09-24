import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRbaTt32,rbaTtAllocate32,rbaTtIntern32,rbaTtSetRoot32,rbaTtEnqueue32,
  rbaTtPublishSurplus32,rbaTtPublishExactOwned32,
  rbaTtManagerAttachDependencies32,rbaTtReconcile32,rbaTtSignalParents32,
  rbaTtDetachDependencies32,rbaTtMarkDone32,rbaTtSignal32,rbaTtRelease32,rbaTtRecycle32,
  rbaTtManagerMergeDuplicate32,rbaTtManagerInspectReady32,rbaTtManagerClean32,
  RBA_TT_ROOT,RBA_TT_DONE,RBA_TT_EVENT_COUNT,RBA_TT_LIVE,
  RBA_TT_PHASE_PENDING_ATTACH,RBA_TT_PHASE_ATTACHED,
} from '../addons/rba-tt32.mjs';
import {
  prepareRbaBranchWorker32,prepareRbaBranchManager32,
  rbaBranchWorkerStep32,rbaBranchManagerStep32,rbaBranchReadyCount32,
} from '../addons/rba-branch-manager.mjs';

function table(){return createRbaTt32({capacity:32,bucketCount:32,keyWords:2,basisCapacity:1,edgeCapacity:2});}
function key(tag){return Uint32Array.from([tag,tag+100]);}
const emptyBasis=new Uint32Array(1);

function makeState(){
  return {
    keys:new Uint32Array(4),
    basis:new Uint32Array(2),
    sizes:new Uint32Array(2),
    labels:new Uint32Array(2),
    lo:new Uint32Array(2),
    hi:new Uint32Array(2),
    priorities:new Int32Array(2),
    present:new Uint32Array(2),
    count:0,
  };
}

function evaluate(t,q,state){
  const tag=t.keys[q*2];
  if(tag===1){
    state.keys.set(key(2),0);
    state.keys.set(key(3),2);
    state.sizes[0]=state.sizes[1]=0;
    state.labels[0]=0;state.labels[1]=1;
    state.lo[0]=state.lo[1]=1;
    state.hi[0]=state.hi[1]=3;
    state.priorities[0]=10;state.priorities[1]=20;
    state.present[0]=state.present[1]=1;
    state.count=2;
    return 4;
  }
  return tag===2?2:3;
}

function publish(t,q,owner,state,code){
  if(code>=1&&code<=3){
    rbaTtPublishExactOwned32(t,q,owner,code);
    return -1;
  }
  if(code!==4)return -1;
  return rbaTtPublishSurplus32(
    t,q,owner,1,3,
    state.keys,0,state.basis,0,1,
    state.sizes,state.labels,state.lo,state.hi,state.present,state.priorities,state.count,
  );
}

function reconcile(t,q,context){
  if(t.phase[q]===RBA_TT_PHASE_PENDING_ATTACH)
    rbaTtManagerAttachDependencies32(t,q,context.resetTargets);
  if(t.phase[q]===RBA_TT_PHASE_ATTACHED)rbaTtReconcile32(t,q,0);
  rbaTtSignalParents32(t,q);
  if(t.exact[q]){
    if(q===t.control[RBA_TT_ROOT]){
      if(t.count[q])rbaTtDetachDependencies32(t,q);
      rbaTtMarkDone32(t);
      return;
    }
    if(t.count[q])rbaTtDetachDependencies32(t,q);
  }
}

test('workers publish surplus directly; manager only inspects/reconciles it',()=>{
  const t=table(),root=rbaTtIntern32(t,key(1),0,emptyBasis,0,0);
  rbaTtSetRoot32(t,root);rbaTtEnqueue32(t,root);
  const resetTargets=new Int32Array(new SharedArrayBuffer(2*4));resetTargets.fill(-2);
  const state=makeState();
  const w=prepareRbaBranchWorker32({owner:2,workerCount:2,state,resetTargets});
  const manager=prepareRbaBranchManager32({capacity:t.capacity,resetTargets});
  const context={resetTargets};

  assert.equal(rbaBranchWorkerStep32(t,w,evaluate,publish),1);
  assert.ok(w.q>=0,'worker did not retain first child');
  assert.equal(rbaBranchReadyCount32(t),1,'worker did not publish surplus directly');

  rbaBranchManagerStep32(t,reconcile,{context,manager});
  assert.equal(rbaBranchReadyCount32(t),1,'manager manufactured or consumed surplus');

  assert.equal(rbaBranchWorkerStep32(t,w,evaluate,publish),1);
  assert.equal(w.q,-1);

  rbaBranchManagerStep32(t,reconcile,{context,manager});
  assert.equal(rbaBranchWorkerStep32(t,w,evaluate,publish),1,'worker did not claim/process surplus');
  assert.equal(rbaBranchReadyCount32(t),0);

  for(let i=0;i<8&&!Atomics.load(t.control,RBA_TT_DONE);i++)
    rbaBranchManagerStep32(t,reconcile,{context,manager});

  assert.equal(Atomics.load(t.control,RBA_TT_DONE),1);
  assert.equal(t.exact[root],3);
  assert.equal(w.claims,3);
  assert.equal(w.branches,1);
  assert.equal(w.evaluations,3);
});

test('manager dedupes equivalent surplus rows; worker publication does not',()=>{
  const t=table(),root=rbaTtIntern32(t,key(1),0,emptyBasis,0,0);
  rbaTtSetRoot32(t,root);rbaTtEnqueue32(t,root);
  const resetTargets=new Int32Array(new SharedArrayBuffer(4));resetTargets.fill(-2);
  const state=makeState();
  const w=prepareRbaBranchWorker32({owner:2,workerCount:1,state,resetTargets});
  const manager=prepareRbaBranchManager32({capacity:t.capacity,resetTargets});
  const context={resetTargets};

  const duplicateEvaluate=(table,q,s)=>{
    if(table.keys[q*2]!==1)return 2;
    s.keys.set(key(2),0);s.keys.set(key(2),2);
    s.sizes[0]=s.sizes[1]=0;s.labels[0]=0;s.labels[1]=1;
    s.lo[0]=s.lo[1]=1;s.hi[0]=s.hi[1]=3;
    s.priorities[0]=10;s.priorities[1]=20;
    s.present[0]=s.present[1]=1;s.count=2;return 4;
  };

  rbaBranchWorkerStep32(t,w,duplicateEvaluate,publish);
  assert.equal(t.control[RBA_TT_LIVE],3,'worker unexpectedly deduped its equivalent children');
  assert.equal(rbaBranchReadyCount32(t),1);

  rbaBranchManagerStep32(t,reconcile,{context,manager});
  assert.ok(manager.maintenancePasses>0);
  assert.equal(rbaBranchReadyCount32(t),0,'redundant queued surplus survived manager dedupe');
  assert.equal(t.control[RBA_TT_LIVE],2,'redundant TT row was not reclaimed');
});

test('manager resets a worker when retained work merges into existing q',()=>{
  const t=table(),existing=rbaTtIntern32(t,key(2),0,emptyBasis,0,0);
  const root=rbaTtIntern32(t,key(1),0,emptyBasis,0,0);
  rbaTtSetRoot32(t,root);rbaTtEnqueue32(t,root);
  const resetTargets=new Int32Array(new SharedArrayBuffer(4));resetTargets.fill(-2);
  const state=makeState();
  const w=prepareRbaBranchWorker32({owner:2,workerCount:1,state,resetTargets});
  const manager=prepareRbaBranchManager32({capacity:t.capacity,resetTargets});
  const context={resetTargets};

  const oneChild=(table,q,s)=>{
    if(table.keys[q*2]!==1)return 2;
    s.keys.set(key(2),0);s.sizes[0]=0;s.labels[0]=0;s.lo[0]=1;s.hi[0]=3;
    s.priorities[0]=50;s.present[0]=1;s.count=1;return 4;
  };

  rbaBranchWorkerStep32(t,w,oneChild,publish);
  assert.ok(w.q>=0&&w.q!==existing);
  rbaBranchManagerStep32(t,reconcile,{context,manager});
  assert.equal(Atomics.load(resetTargets,0),-1,'manager did not request worker reset');

  rbaBranchWorkerStep32(t,w,oneChild,publish);
  assert.equal(w.q,-1,'worker did not honor manager reset before further evaluation');
  assert.equal(Atomics.load(resetTargets,0),-2);
});

test('manager event budget bounds one scheduling turn',()=>{
  const t=table(),resetTargets=new Int32Array(new SharedArrayBuffer(4));resetTargets.fill(-2);
  for(let tag=1;tag<=3;tag++){
    const q=rbaTtIntern32(t,key(tag),0,emptyBasis,0,0);
    rbaTtSignal32(t,q);
  }
  assert.equal(t.control[RBA_TT_EVENT_COUNT],3);
  const manager=prepareRbaBranchManager32({capacity:t.capacity,resetTargets});
  const processed=rbaBranchManagerStep32(t,()=>{}, {budget:1,manager});
  assert.equal(processed,1);
  assert.equal(t.control[RBA_TT_EVENT_COUNT],2);
});


test('redirect pin keeps canonical q alive until pending duplicate lifetime ends',()=>{
  const t=table(),resetTargets=new Int32Array(new SharedArrayBuffer(4));resetTargets.fill(-2);
  const canonical=rbaTtIntern32(t,key(2),0,emptyBasis,0,0);
  const duplicate=rbaTtAllocate32(t,key(2),0,emptyBasis,0,0,1);
  const cg=t.generation[canonical],dg=t.generation[duplicate];

  assert.equal(rbaTtManagerMergeDuplicate32(t,duplicate,canonical,resetTargets),1);
  assert.equal(t.redirect[duplicate],canonical);
  assert.equal(t.refs[canonical],2,'redirect did not pin canonical');

  rbaTtRelease32(t,canonical,cg);
  assert.equal(t.live[canonical],1,'canonical recycled while redirect still depended on it');
  assert.equal(t.refs[canonical],1);

  rbaTtRelease32(t,duplicate,dg);
  rbaTtRecycle32(t,duplicate);
  assert.equal(t.live[duplicate],0);
  assert.equal(t.refs[canonical],0,'redirect pin was not released with duplicate row');
});

test('manager inspects newest surplus before an old head window',()=>{
  const t=table(),resetTargets=new Int32Array(new SharedArrayBuffer(4));resetTargets.fill(-2);
  const canonical=rbaTtIntern32(t,key(20),0,emptyBasis,0,0);
  for(let tag=1;tag<=4;tag++){
    const q=rbaTtIntern32(t,key(tag),0,emptyBasis,0,0,tag);
    assert.equal(rbaTtEnqueue32(t,q),1);
  }
  const duplicate=rbaTtAllocate32(t,key(20),0,emptyBasis,0,0,99);
  assert.equal(rbaTtEnqueue32(t,duplicate),1);
  assert.equal(rbaBranchReadyCount32(t),5);

  assert.equal(rbaTtManagerInspectReady32(t,resetTargets,1),1,
    'one-item manager window did not inspect newest surplus');
  assert.equal(t.redirect[duplicate],canonical);
  assert.equal(t.readyMember[duplicate],0);
  assert.equal(t.readyMember[canonical],1);
  assert.equal(rbaBranchReadyCount32(t),5,
    'dedupe should replace redundant work with its unresolved canonical q');
});

test('manager duplicate inspection is generation-stamped and later duplicates find the stamped canonical',()=>{
  const t=table(),resetTargets=new Int32Array(new SharedArrayBuffer(4));resetTargets.fill(-2);
  const canonical=rbaTtIntern32(t,key(24),0,emptyBasis,0,0,10);
  assert.equal(rbaTtEnqueue32(t,canonical),1);

  assert.equal(t.inspectGeneration[canonical],0);
  assert.equal(rbaTtManagerInspectReady32(t,resetTargets,1),0);
  assert.equal(t.inspectGeneration[canonical],t.generation[canonical]);

  const duplicate=rbaTtAllocate32(t,key(24),0,emptyBasis,0,0,20);
  assert.equal(rbaTtEnqueue32(t,duplicate),1);
  assert.equal(rbaTtManagerInspectReady32(t,resetTargets,1),1);
  assert.equal(t.redirect[duplicate],canonical);
  assert.equal(t.inspectGeneration[canonical],t.generation[canonical]);
});

test('TT sweep stamps retained q once for its generation',()=>{
  const t=table(),resetTargets=new Int32Array(new SharedArrayBuffer(4));resetTargets.fill(-2);
  const q=rbaTtAllocate32(t,key(25),0,emptyBasis,0,0,1);
  assert.equal(t.readyMember[q],0);
  assert.equal(t.inspectGeneration[q],0);
  rbaTtManagerClean32(t,resetTargets,q,1);
  assert.equal(t.inspectGeneration[q],t.generation[q]);
});

test('already-inspected surplus attaches without losing later duplicate convergence',()=>{
  const t=table(),root=rbaTtIntern32(t,key(1),0,emptyBasis,0,0);
  rbaTtSetRoot32(t,root);rbaTtEnqueue32(t,root);
  const resetTargets=new Int32Array(new SharedArrayBuffer(4));resetTargets.fill(-2);
  const state=makeState(),worker=prepareRbaBranchWorker32({owner:2,workerCount:1,state,resetTargets});

  assert.equal(rbaBranchWorkerStep32(t,worker,evaluate,publish),1);
  assert.equal(t.phase[root],RBA_TT_PHASE_PENDING_ATTACH);
  const edge=root*t.edgeCapacity+1,child=t.child[edge];
  assert.ok(child>=0);
  assert.equal(t.inspectGeneration[child],0);

  rbaTtManagerInspectReady32(t,resetTargets,1);
  assert.equal(t.inspectGeneration[child],t.generation[child]);

  assert.equal(rbaTtManagerAttachDependencies32(t,root,resetTargets),1);
  assert.equal(t.phase[root],RBA_TT_PHASE_ATTACHED);
  assert.equal(t.child[edge],child);

  const duplicate=rbaTtAllocate32(t,key(3),0,emptyBasis,0,0,99);
  assert.equal(rbaTtEnqueue32(t,duplicate),1);
  assert.equal(rbaTtManagerInspectReady32(t,resetTargets,1),1);
  assert.equal(t.redirect[duplicate],child);
  assert.equal(t.child[edge],child);
});
