import {Worker} from './worker.mjs';
import {
  rbaTtEnter32,
  rbaTtLeave32,
  rbaTtTake32,
  rbaTtTakeEvent32,
  rbaTtReleaseExecution32,
  rbaTtManagerInspectReady32,
  rbaTtManagerClean32,
  rbaTtFail32,
  RBA_TT_STOP,
  RBA_TT_DONE,
  RBA_TT_WAKE,
  RBA_TT_READY_COUNT,
  RBA_TT_ERR_CONTRACT,
} from './rba-tt32.mjs';

// Shared-TT branch-manager execution substrate.
//
// The TT remains the sole authority for q identity, dependency topology,
// ready/event membership and lifetime. This add-on does not create a second
// task table or branch descriptor population.
//
// Domain/application code supplies:
//   evaluate(table,q,state,expose,context) -> numeric prepared-result code
//   publish(table,q,owner,state,code,context) -> retained child q or -1
//   reconcile(table,q,context) -> manager-side propagation/reconciliation
//
// evaluate runs outside the TT transaction. publish/reconcile run while the
// caller owns the TT transaction. A successful publish must release execution
// ownership of q and may directly retain at most one runnable child for owner.

export class RbaBranchWorker extends Worker {
  constructor({
    owner,
    workerCount=1,
    readyTarget=workerCount*2,
    state=null,
    resetTargets=null,
  }={}){
    if(!Number.isInteger(owner)||owner<2||owner>0x7fffffff||
       !Number.isInteger(workerCount)||workerCount<1||
       !Number.isInteger(readyTarget)||readyTarget<0)
      throw new RangeError('invalid RBA branch worker configuration');
    const resetIndex=owner-2;
    if(resetTargets!==null&&
       (!(resetTargets instanceof Int32Array)||resetIndex>=resetTargets.length))
      throw new RangeError('invalid RBA branch worker reset target');
    super(owner);
    this.workerCount=workerCount;
    this.readyTarget=readyTarget;
    this.state=state;
    this.resetTargets=resetTargets;
    this.resetIndex=resetIndex;
    this.q=-1;
    this.code=0;
    this.claims=0;
    this.branches=0;
    this.evaluations=0;
    this.idlePolls=0;
  }

  run(t,evaluate,publish,options={}){
    return runRbaBranchWorkerLoop32(t,this,evaluate,publish,options);
  }
}

export function prepareRbaBranchWorker32(options={}){
  return new RbaBranchWorker(options);
}

export function rbaBranchReadyCount32(t){
  return t.control[RBA_TT_READY_COUNT];
}

export function prepareRbaBranchManager32({capacity,resetTargets=null,budget=64}={}){
  if(!Number.isInteger(capacity)||capacity<1||!Number.isInteger(budget)||budget<1)
    throw new RangeError('invalid RBA branch manager capacity');
  return {
    scanCursor:0,
    resetTargets,
    readyScratch:new Int32Array(budget),
    routeHeads:new Int32Array(256),
    routeNext:new Int32Array(budget),
    events:0,
    dedupes:0,
    maintenancePasses:0,
  };
}

function applyWorkerReset32(t,worker){
  const reset=worker.resetTargets;
  if(!reset||Atomics.load(reset,worker.resetIndex)===-2)return 0;
  if(!rbaTtEnter32(t,worker.owner))return -1;
  try{
    if(worker.q>=0&&t.execution[worker.q]===worker.owner)
      rbaTtReleaseExecution32(t,worker.q,worker.owner);
    worker.q=-1;worker.code=0;
    Atomics.store(reset,worker.resetIndex,-2);
  }finally{
    rbaTtLeave32(t);
  }
  Atomics.add(t.control,RBA_TT_WAKE,1);
  Atomics.notify(t.control,RBA_TT_WAKE);
  return 1;
}

function rbaBranchManagerStepKnown32(
  t,
  reconcile,
  owner,
  budget,
  context,
  manager,
){
if(!rbaTtEnter32(t,owner))return 0;
  let processed=0,merged=0;
  try{
    while(processed<budget&&!Atomics.load(t.control,RBA_TT_STOP)){
      const q=rbaTtTakeEvent32(t);
      if(q===-1)break;
      reconcile(t,q,context);
      processed+=1;
      if(manager)manager.events+=1;
    }
    if(manager){
      merged=rbaTtManagerInspectReady32(
        t,manager.resetTargets,budget,manager.readyScratch,manager.routeHeads,manager.routeNext,
      );
      manager.dedupes+=merged;
      manager.scanCursor=rbaTtManagerClean32(t,manager.resetTargets,manager.scanCursor,budget);
      manager.maintenancePasses+=1;
    }
  }finally{
    rbaTtLeave32(t);
  }
  if(processed||merged){
    Atomics.add(t.control,RBA_TT_WAKE,1);
    Atomics.notify(t.control,RBA_TT_WAKE);
  }
  return processed+merged;
}

export function rbaBranchManagerStep32(
  t,
  reconcile,
  {owner=1,budget=64,context=null,manager=null}={},
){
  if(typeof reconcile!=='function')throw new TypeError('RBA reconcile callback required');
  if(!Number.isInteger(owner)||owner<1||owner>0x7fffffff||
     !Number.isInteger(budget)||budget<1)
    throw new RangeError('invalid RBA branch-manager configuration');
  return rbaBranchManagerStepKnown32(t,reconcile,owner,budget,context,manager);
}

export function runRbaBranchManagerLoop32(
  t,
  reconcile,
  {owner=1,budget=64,context=null,waitMs=1,manager=null}={},
){
  if(typeof reconcile!=='function')throw new TypeError('RBA reconcile callback required');
  if(!Number.isInteger(owner)||owner<1||owner>0x7fffffff||
     !Number.isInteger(budget)||budget<1)
    throw new RangeError('invalid RBA branch-manager configuration');
  if(!Number.isFinite(waitMs)||waitMs<0)throw new RangeError('invalid RBA manager wait');
  while(!Atomics.load(t.control,RBA_TT_STOP)&&!Atomics.load(t.control,RBA_TT_DONE)){
    const observed=Atomics.load(t.control,RBA_TT_WAKE);
    if(!rbaBranchManagerStepKnown32(t,reconcile,owner,budget,context,manager))
      Atomics.wait(t.control,RBA_TT_WAKE,observed,waitMs);
  }
  return Atomics.load(t.control,RBA_TT_DONE)?1:0;
}

function rbaBranchWorkerStepKnown32(
  t,
  worker,
  evaluate,
  publish,
  context=null,
){
const resetBefore=applyWorkerReset32(t,worker);
  if(resetBefore<0)return 0;
  if(resetBefore>0)return 1;

  if(worker.q===-1){
    if(!rbaTtEnter32(t,worker.owner))return 0;
    worker.q=rbaTtTake32(t,worker.owner);
    // Surplus publication is unconditional; exposure is a lifetime constant 0.
    rbaTtLeave32(t);
    if(worker.q===-1){worker.idlePolls+=1;return 0;}
    worker.claims+=1;
    worker.code=0;
  }

  if(worker.code===0){
    worker.code=evaluate(t,worker.q,worker.state,0,context);
    worker.evaluations+=1;
  }

  if(!rbaTtEnter32(t,worker.owner))return 0;
  const q=worker.q;
  let next=-1;
  try{
    // A manager reset is created only by redirecting this execution-owned q.
    // Once the publish TT transaction is owned, redirect is the authoritative
    // reset assertion; no second shared atomic reset poll is required.
    if(t.redirect[q]>=0){
      if(t.execution[q]===worker.owner)
        rbaTtReleaseExecution32(t,q,worker.owner);
      if(worker.resetTargets)
        Atomics.store(worker.resetTargets,worker.resetIndex,-2);
      worker.code=0;
    }else if(t.execution[q]!==worker.owner){
      t.fault[0]=4;t.fault[1]=q;t.fault[2]=worker.owner;t.fault[3]=t.execution[q];
      rbaTtFail32(t,RBA_TT_ERR_CONTRACT);
    }else{
      next=publish(t,q,worker.owner,worker.state,worker.code,context);
      if(t.execution[q]===worker.owner)
        rbaTtFail32(t,RBA_TT_ERR_CONTRACT);
      if(next>=0&&t.execution[next]!==worker.owner){
        t.fault[0]=5;t.fault[1]=next;t.fault[2]=worker.owner;t.fault[3]=t.execution[next];
        rbaTtFail32(t,RBA_TT_ERR_CONTRACT);
        next=-1;
      }
    }
  }finally{
    rbaTtLeave32(t);
  }

  if(worker.code===4)worker.branches+=1;
  worker.q=next;
  worker.code=0;
  if(next>=0)worker.claims+=1;
  Atomics.add(t.control,RBA_TT_WAKE,1);
  Atomics.notify(t.control,RBA_TT_WAKE);
  return 1;
}

export function rbaBranchWorkerStep32(
  t,
  worker,
  evaluate,
  publish,
  context=null,
){
  if(typeof evaluate!=='function'||typeof publish!=='function')
    throw new TypeError('RBA worker callbacks required');
  return rbaBranchWorkerStepKnown32(t,worker,evaluate,publish,context);
}

export function runRbaBranchWorkerLoop32(
  t,
  worker,
  evaluate,
  publish,
  {context=null,waitMs=1,metrics=null,publishMetrics=null}={},
){
  if(typeof evaluate!=='function'||typeof publish!=='function')
    throw new TypeError('RBA worker callbacks required');
  if(publishMetrics!==null&&typeof publishMetrics!=='function')
    throw new TypeError('RBA metric publisher must be a function');
  if(!Number.isFinite(waitMs)||waitMs<0)throw new RangeError('invalid RBA worker wait');
  let telemetry=0;
  while(!Atomics.load(t.control,RBA_TT_STOP)&&!Atomics.load(t.control,RBA_TT_DONE)){
    const observed=Atomics.load(t.control,RBA_TT_WAKE);
    if(!rbaBranchWorkerStepKnown32(t,worker,evaluate,publish,context))
      Atomics.wait(t.control,RBA_TT_WAKE,observed,waitMs);
    if(metrics){
      telemetry+=1;
      if((telemetry&1023)===0){
        metrics[0]=worker.claims;
        metrics[1]=worker.branches;
        metrics[2]=worker.evaluations;
        metrics[3]=worker.idlePolls;
        if(publishMetrics)publishMetrics(worker,metrics);
      }
    }
  }
  if(metrics){
    metrics[0]=worker.claims;
    metrics[1]=worker.branches;
    metrics[2]=worker.evaluations;
    metrics[3]=worker.idlePolls;
    if(publishMetrics)publishMetrics(worker,metrics);
  }
  return Atomics.load(t.control,RBA_TT_DONE)?1:0;
}
