import {workerData} from 'node:worker_threads';
import {
  prepareConnect4CpcRbaEvaluator,
  evaluateConnect4CpcRbaTt32,
  publishConnect4CpcRbaEvaluation32,
} from './rba-connect4-solver.mjs';
import {
  prepareRbaBranchWorker32,
  runRbaBranchWorkerLoop32,
} from './rba-branch-manager.mjs';
import {RBA_TT_ROOT} from './rba-tt32.mjs';

const table=workerData.table,
  g=workerData.geometry,
  witness=new Int32Array(workerData.runtimeBuffer,0,1),
  metrics=new Float64Array(workerData.runtimeBuffer,workerData.metricOffsetBytes,12),
  resetTargets=new Int32Array(
    workerData.runtimeBuffer,
    workerData.resetOffsetBytes,
    workerData.resetCount,
  ),
  rootQ=table.control[RBA_TT_ROOT],
  rootReflected=workerData.rootReflected?1:0,
  state=prepareConnect4CpcRbaEvaluator({
    geometry:g,
    cpcFrontierResponse:!!workerData.cpcFrontierResponse,
    cpcProjectedAdvisory:!!workerData.cpcProjectedAdvisory,
    positionCode:false,
  }),
  worker=prepareRbaBranchWorker32({
    owner:workerData.owner,
    state,
    resetTargets,
  });

const evaluate=(t,q,s)=>{
  const code=evaluateConnect4CpcRbaTt32(t,q,s,rootQ,rootReflected),
    n=worker.evaluations+1;
  if((n&1023)===1){
    metrics[0]=worker.claims;
    metrics[1]=worker.branches+(code===4?1:0);
    metrics[2]=n;
    metrics[3]=worker.idlePolls;
    metrics[4]=state.cpcCalls;
    metrics[5]=state.cpcExact;
    metrics[6]=state.cpcBounds;
    metrics[7]=state.cpcRestrictions;
    metrics[8]=state.cpcForced;
    metrics[9]=state.cpcPrecursors;
    metrics[10]=state.transitions;
    metrics[11]=0;
  }
  return code;
};
const publish=(t,q,owner,s,code)=>
  publishConnect4CpcRbaEvaluation32(
    t,q,owner,s,code,rootQ,witness,0,
  );
runRbaBranchWorkerLoop32(
  table,
  worker,
  evaluate,
  publish,
  {waitMs:1},
);

metrics[0]=worker.claims;
metrics[1]=worker.branches;
metrics[2]=worker.evaluations;
metrics[3]=worker.idlePolls;
metrics[4]=state.cpcCalls;
metrics[5]=state.cpcExact;
metrics[6]=state.cpcBounds;
metrics[7]=state.cpcRestrictions;
metrics[8]=state.cpcForced;
metrics[9]=state.cpcPrecursors;
metrics[10]=state.transitions;
metrics[11]=0;
