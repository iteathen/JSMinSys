import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createRbaTt32,rbaTtIntern32,rbaTtSetRoot32,rbaTtEnqueue32,
  rbaTtPublishPrepared32,rbaTtPublishExactOwned32,
  rbaTtAttachDependencies32,rbaTtReconcile32,rbaTtSignalParents32,
  rbaTtEnqueueDependencies32,rbaTtDetachDependencies32,rbaTtMarkDone32,
  rbaTtSignal32,
  RBA_TT_ROOT,RBA_TT_DONE,RBA_TT_EVENT_COUNT,RBA_TT_PHASE_PENDING_ATTACH,RBA_TT_PHASE_ATTACHED,
} from '../addons/rba-tt32.mjs';
import {
  prepareRbaBranchWorker32,rbaBranchWorkerStep32,rbaBranchManagerStep32,
  rbaBranchReadyCount32,
} from '../addons/rba-branch-manager.mjs';

function table(){return createRbaTt32({capacity:16,bucketCount:16,keyWords:2,basisCapacity:1,edgeCapacity:2});}
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
  return rbaTtPublishPrepared32(
    t,q,owner,1,3,
    state.keys,0,
    state.basis,0,1,
    state.sizes,state.labels,state.lo,state.hi,state.present,state.count,
  );
}

function reconcile(t,q){
  if(t.phase[q]===RBA_TT_PHASE_PENDING_ATTACH)rbaTtAttachDependencies32(t,q);
  if(t.phase[q]===RBA_TT_PHASE_ATTACHED)rbaTtReconcile32(t,q,0);
  rbaTtSignalParents32(t,q);
  if(t.exact[q]){
    if(q===t.control[RBA_TT_ROOT]){
      if(t.count[q])rbaTtDetachDependencies32(t,q);
      rbaTtMarkDone32(t);
      return;
    }
    if(t.count[q])rbaTtDetachDependencies32(t,q);
  }else{
    rbaTtEnqueueDependencies32(t,q);
  }
}

test('branch manager retains one child and exposes only surplus work',()=>{
  const t=table(),root=rbaTtIntern32(t,key(1),0,emptyBasis,0,0);
  rbaTtSetRoot32(t,root);rbaTtEnqueue32(t,root);
  const w=prepareRbaBranchWorker32({owner:2,workerCount:2,state:makeState()});

  assert.equal(rbaBranchWorkerStep32(t,w,evaluate,publish),1);
  assert.ok(w.q>=0,'worker did not retain first child');
  assert.equal(rbaBranchReadyCount32(t),0,'surplus became visible before manager attachment');

  assert.equal(rbaBranchManagerStep32(t,reconcile),1);
  assert.equal(rbaBranchReadyCount32(t),1,'manager did not expose exactly one surplus child');

  assert.equal(rbaBranchWorkerStep32(t,w,evaluate,publish),1);
  assert.equal(w.q,-1);

  assert.ok(rbaBranchManagerStep32(t,reconcile)>=1);
  assert.equal(rbaBranchWorkerStep32(t,w,evaluate,publish),1,'worker did not claim/process surplus child');
  assert.equal(rbaBranchReadyCount32(t),0);
  assert.equal(w.q,-1);

  for(let i=0;i<4&&!Atomics.load(t.control,RBA_TT_DONE);i++)
    rbaBranchManagerStep32(t,reconcile);

  assert.equal(Atomics.load(t.control,RBA_TT_DONE),1);
  assert.equal(t.exact[root],3);
  assert.equal(w.claims,3);
  assert.equal(w.branches,1);
  assert.equal(w.evaluations,3);
});

test('manager event budget bounds one scheduling turn',()=>{
  const t=table();
  for(let tag=1;tag<=3;tag++){
    const q=rbaTtIntern32(t,key(tag),0,emptyBasis,0,0);
    rbaTtSignal32(t,q);
  }
  assert.equal(t.control[RBA_TT_EVENT_COUNT],3);
  const processed=rbaBranchManagerStep32(t,()=>{}, {budget:1});
  assert.equal(processed,1);
  assert.equal(t.control[RBA_TT_EVENT_COUNT],2);
  const w=prepareRbaBranchWorker32({owner:7,workerCount:4,state:null,readyTarget:8});
  assert.equal(w.owner,7);assert.equal(w.readyTarget,8);
});
