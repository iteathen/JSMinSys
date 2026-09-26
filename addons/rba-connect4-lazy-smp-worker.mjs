import {workerData} from 'node:worker_threads';
import {
  prepareConnect4RbaAlphaBeta,
  solveConnect4RbaAlphaBeta,
  RBA_AB_CPC_ONLY,
} from './rba-connect4-alphabeta.mjs';

const CONTROL_DONE=1,CONTROL_WAKE=3,CONTROL_WINNER=4,
  RESULT_STRIDE=4,METRIC_WIDTH=15,
  index=workerData.workerIndex,
  resultBase=index*RESULT_STRIDE,
  metricBase=index*METRIC_WIDTH,
  control=workerData.control,
  resultWords=workerData.resultWords,
  metrics=new Float64Array(workerData.metricBuffer);

if(workerData.sharedExactCache)workerData.sharedExactCache.workerIndex=index;

const state=prepareConnect4RbaAlphaBeta({
    geometry:workerData.geometry,
    mode:RBA_AB_CPC_ONLY,
    cacheCapacity:workerData.localCacheCapacity,
    sharedExactCache:workerData.sharedExactCache,
    sharedSampleMask:workerData.sharedSampleMask,
    orderOffset:index%workerData.geometry.columns,
    cpcFrontierResponse:!!workerData.cpcFrontierResponse,
    cpcProjectedAdvisory:!!workerData.cpcProjectedAdvisory,
  }),
  result=solveConnect4RbaAlphaBeta(
    workerData.root,
    {state,reflected:workerData.rootReflected?1:0},
  ),
  m=result.metrics;

metrics[metricBase]=m.nodes;
metrics[metricBase+1]=m.cutoffs;
metrics[metricBase+2]=m.cacheHits;
metrics[metricBase+3]=m.cpcExact;
metrics[metricBase+4]=m.cpcBounds;
metrics[metricBase+5]=m.cpcRestrictions;
metrics[metricBase+6]=m.cpcForced;
metrics[metricBase+7]=m.cpcPrecursors;
metrics[metricBase+8]=m.cpcProjectedForks;
metrics[metricBase+9]=m.frontCalls;
metrics[metricBase+10]=m.frontExact;
metrics[metricBase+11]=m.frontFailures;
metrics[metricBase+12]=m.frontSteps;
metrics[metricBase+13]=m.frontActionExact;
metrics[metricBase+14]=m.cofactors;

Atomics.store(resultWords,resultBase,result.value);
Atomics.store(resultWords,resultBase+1,result.relative);
Atomics.store(resultWords,resultBase+2,result.move);
Atomics.store(resultWords,resultBase+3,1);

if(Atomics.compareExchange(control,CONTROL_WINNER,-1,index)===-1){
  Atomics.store(control,CONTROL_DONE,1);
  Atomics.add(control,CONTROL_WAKE,1);
  Atomics.notify(control,CONTROL_WAKE);
}
