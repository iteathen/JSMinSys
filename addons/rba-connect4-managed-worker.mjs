import {workerData} from 'node:worker_threads';
import {
  prepareConnect4RbaAlphaBeta,
  solveConnect4RbaAlphaBeta,
  RBA_AB_CPC_ONLY,
} from './rba-connect4-alphabeta.mjs';
import {
  prepareConnect4CpcRbaEvaluator,
  evaluateConnect4SurplusFightTt32,
  publishConnect4CpcRbaEvaluation32,
  publishConnect4SurplusFightEvaluation32,
} from './rba-connect4-solver.mjs';
import {
  prepareRbaBranchWorker32,
  runRbaBranchWorkerLoop32,
} from './rba-branch-manager.mjs';
import {RBA_TT_ROOT} from './rba-tt32.mjs';

const table=workerData.table,
  g=workerData.geometry,
  spike=workerData.surplusFightSpike?1:0,
  witness=new Int32Array(workerData.runtimeBuffer,0,1),
  metrics=new Float64Array(workerData.runtimeBuffer,workerData.metricOffsetBytes,16),
  resetTargets=new Int32Array(
    workerData.runtimeBuffer,
    workerData.resetOffsetBytes,
    workerData.resetCount,
  ),
  rootQ=table.control[RBA_TT_ROOT],
  rootReflected=workerData.rootReflected?1:0,
  state=spike
    ?prepareConnect4CpcRbaEvaluator({
      geometry:g,
      cpcFrontierResponse:!!workerData.cpcFrontierResponse,
      cpcProjectedAdvisory:!!workerData.cpcProjectedAdvisory,
      positionCode:false,
    })
    :{
      g,
      ab:prepareConnect4RbaAlphaBeta({
        geometry:g,
        mode:RBA_AB_CPC_ONLY,
        cacheCapacity:65536,
        cpcFrontierResponse:!!workerData.cpcFrontierResponse,
        cpcProjectedAdvisory:!!workerData.cpcProjectedAdvisory,
      }),
      witness:-1,
    },
  worker=prepareRbaBranchWorker32({
    owner:workerData.owner,
    workerCount:workerData.workerCount,
    state,
    resetTargets,
  });

const evaluate=(t,q,s)=>{
  if(spike){
    const code=evaluateConnect4SurplusFightTt32(t,q,s,rootQ,rootReflected);
    metrics[0]=worker.claims;
    metrics[1]=worker.branches+(code===4?1:0);
    metrics[2]=worker.evaluations+1;
    metrics[3]=worker.idlePolls;
    metrics[4]=s.cpcCalls;
    metrics[5]=s.cpcExact;
    metrics[6]=s.cpcBounds;
    metrics[7]=s.cpcRestrictions;
    metrics[8]=s.cpcForced;
    metrics[9]=s.cpcPrecursors;
    metrics[10]=s.transitions;
    metrics[11]=0;
    metrics[12]=metrics[13]=metrics[14]=metrics[15]=0;
    return code;
  }
  if(q!==rootQ)throw new Error('Phase-1 managed Negamax received non-root surplus q');
  const result=solveConnect4RbaAlphaBeta(
      workerData.root,
      {state:s.ab,reflected:rootReflected},
    ),
    m=result.metrics,
    move=result.move,
    nodes=m.nodes,
    cutoffs=m.cutoffs,
    cacheHits=m.cacheHits,
    cofactors=m.cofactors;
  s.witness=move;
  metrics[0]=worker.claims;
  metrics[1]=0;
  metrics[2]=worker.evaluations+1;
  metrics[3]=worker.idlePolls;
  metrics[4]=move<0?0:1+nodes-cacheHits;
  metrics[5]=m.cpcExact;
  metrics[6]=m.cpcBounds;
  metrics[7]=m.cpcRestrictions;
  metrics[8]=m.cpcForced;
  metrics[9]=m.cpcPrecursors;
  metrics[10]=cofactors;
  metrics[11]=0;
  metrics[12]=nodes;
  metrics[13]=cutoffs;
  metrics[14]=cacheHits;
  metrics[15]=cofactors;
  return result.value;
};
const publish=(t,q,owner,s,code)=>
  spike
    ?publishConnect4SurplusFightEvaluation32(t,q,owner,s,code,rootQ,witness,0)
    :publishConnect4CpcRbaEvaluation32(t,q,owner,s,code,rootQ,witness,0);
runRbaBranchWorkerLoop32(
  table,
  worker,
  evaluate,
  publish,
  {waitMs:1,nonblocking:!!spike},
);

metrics[0]=worker.claims;
metrics[1]=worker.branches;
metrics[2]=worker.evaluations;
metrics[3]=worker.idlePolls;
