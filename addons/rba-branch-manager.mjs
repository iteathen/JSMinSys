import {
  rbaTtEnter32,
  rbaTtLeave32,
  rbaTtTake32,
  rbaTtTakeEvent32,
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

export function prepareRbaBranchWorker32({
  owner,
  workerCount=1,
  readyTarget=workerCount*2,
  state=null,
}={}){
  if(!Number.isInteger(owner)||owner<2||owner>0x7fffffff||
     !Number.isInteger(workerCount)||workerCount<1||
     !Number.isInteger(readyTarget)||readyTarget<0)
    throw new RangeError('invalid RBA branch worker configuration');
  return {
    owner,
    workerCount,
    readyTarget,
    state,
    q:-1,
    code:0,
    expose:0,
    claims:0,
    branches:0,
    evaluations:0,
    idlePolls:0,
  };
}

export function rbaBranchReadyCount32(t){
  return t.control[RBA_TT_READY_COUNT];
}

export function rbaBranchManagerStep32(
  t,
  reconcile,
  {owner=1,budget=64,context=null}={},
){
  if(typeof reconcile!=='function')throw new TypeError('RBA reconcile callback required');
  if(!Number.isInteger(owner)||owner<1||owner>0x7fffffff||
     !Number.isInteger(budget)||budget<1)
    throw new RangeError('invalid RBA branch-manager configuration');
  if(!rbaTtEnter32(t,owner))return 0;
  let processed=0;
  try{
    while(processed<budget&&!Atomics.load(t.control,RBA_TT_STOP)){
      const q=rbaTtTakeEvent32(t);
      if(q===-1)break;
      reconcile(t,q,context);
      processed+=1;
      if(Atomics.load(t.control,RBA_TT_STOP))break;
    }
  }finally{
    rbaTtLeave32(t);
  }
  if(processed){
    Atomics.add(t.control,RBA_TT_WAKE,1);
    Atomics.notify(t.control,RBA_TT_WAKE);
  }
  return processed;
}

export function runRbaBranchManagerLoop32(
  t,
  reconcile,
  {owner=1,budget=64,context=null,waitMs=1}={},
){
  if(!Number.isFinite(waitMs)||waitMs<0)throw new RangeError('invalid RBA manager wait');
  while(!Atomics.load(t.control,RBA_TT_STOP)&&!Atomics.load(t.control,RBA_TT_DONE)){
    const observed=Atomics.load(t.control,RBA_TT_WAKE);
    if(!rbaBranchManagerStep32(t,reconcile,{owner,budget,context}))
      Atomics.wait(t.control,RBA_TT_WAKE,observed,waitMs);
  }
  return Atomics.load(t.control,RBA_TT_DONE)?1:0;
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

  if(worker.q===-1){
    if(!rbaTtEnter32(t,worker.owner))return 0;
    worker.q=rbaTtTake32(t,worker.owner);
    worker.expose=worker.workerCount>1&&
      t.control[RBA_TT_READY_COUNT]<worker.readyTarget?1:0;
    rbaTtLeave32(t);
    if(worker.q===-1){worker.idlePolls+=1;return 0;}
    worker.claims+=1;
    worker.code=0;
  }

  if(worker.code===0){
    worker.code=evaluate(t,worker.q,worker.state,worker.expose,context);
    worker.evaluations+=1;
  }

  if(!rbaTtEnter32(t,worker.owner))return 0;
  const q=worker.q;
  let next=-1;
  try{
    if(t.execution[q]!==worker.owner){
      rbaTtFail32(t,RBA_TT_ERR_CONTRACT);
    }else{
      next=publish(t,q,worker.owner,worker.state,worker.code,context);
      if(t.execution[q]===worker.owner)
        rbaTtFail32(t,RBA_TT_ERR_CONTRACT);
      if(next>=0&&t.execution[next]!==worker.owner){
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

export function runRbaBranchWorkerLoop32(
  t,
  worker,
  evaluate,
  publish,
  {context=null,waitMs=1,metrics=null}={},
){
  if(!Number.isFinite(waitMs)||waitMs<0)throw new RangeError('invalid RBA worker wait');
  while(!Atomics.load(t.control,RBA_TT_STOP)&&!Atomics.load(t.control,RBA_TT_DONE)){
    const observed=Atomics.load(t.control,RBA_TT_WAKE);
    if(!rbaBranchWorkerStep32(t,worker,evaluate,publish,context))
      Atomics.wait(t.control,RBA_TT_WAKE,observed,waitMs);
    if(metrics){
      metrics[0]=worker.claims;
      metrics[1]=worker.branches;
      metrics[2]=worker.evaluations;
      metrics[3]=worker.idlePolls;
    }
  }
  return Atomics.load(t.control,RBA_TT_DONE)?1:0;
}
