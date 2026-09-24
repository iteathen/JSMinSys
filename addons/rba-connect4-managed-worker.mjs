import {workerData} from 'node:worker_threads';
import {prepareConnect4RbaGeometry} from './rba-connect4-geometry.mjs';
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
  g=prepareConnect4RbaGeometry(workerData.geometryConfig),
  witness=new Int32Array(workerData.witnessBuffer),
  metrics=new Float64Array(workerData.metricsBuffer),
  resetTargets=new Int32Array(workerData.resetBuffer),
  rootQ=table.control[RBA_TT_ROOT],
  rootReflected=workerData.rootReflected?1:0,
  state=prepareConnect4CpcRbaEvaluator({
    geometry:g,
    cpcFrontierResponse:!!workerData.cpcFrontierResponse,
    cpcProjectedAdvisory:!!workerData.cpcProjectedAdvisory,
  }),
  worker=prepareRbaBranchWorker32({
    owner:workerData.owner,
    state,
    resetTargets,
  });

const evaluate=(t,q,s)=>
  evaluateConnect4CpcRbaTt32(t,q,s,rootQ,rootReflected);
const publish=(t,q,owner,s,code)=>
  publishConnect4CpcRbaEvaluation32(
    t,q,owner,s,code,rootQ,witness,0,
  );
const publishMetrics=(_worker,out)=>{
  out[4]=state.cpcCalls;
  out[5]=state.cpcExact;
  out[6]=state.cpcBounds;
  out[7]=state.cpcRestrictions;
  out[8]=state.cpcForced;
  out[9]=state.cpcPrecursors;
  out[10]=state.transitions;
  out[11]=0;
};

runRbaBranchWorkerLoop32(
  table,
  worker,
  evaluate,
  publish,
  {waitMs:1,metrics,publishMetrics},
);
