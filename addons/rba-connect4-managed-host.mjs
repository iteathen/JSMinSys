import {performance} from 'node:perf_hooks';
import {
  createManagedThreadSession32,
  spawnManagedFileWorker32,
  waitManagedThreadSession32,
  closeManagedThreadSession32,
  managedThreadSessionState32,
  sumMetricViews32,
  sharedViewBytes32,
} from './branch-manager-host.mjs';
import {
  createRbaTt32,
  rbaTtIntern32,
  rbaTtSetRoot32,
  rbaTtEnqueue32,
  RBA_TT_STOP,
  RBA_TT_DONE,
  RBA_TT_ERROR,
  RBA_TT_WAKE,
  RBA_TT_READY_COUNT,
  RBA_TT_EVENT_COUNT,
  RBA_TT_LIVE,
} from './rba-tt32.mjs';
import {connect4RbaFromMoves} from './rba-connect4-solver.mjs';
import {shareConnect4RbaGeometry32} from './rba-connect4-geometry.mjs';

const HOST_WORKER_DIED=101;
const HOST_DEADLINE=102;
const HOST_CANCELLED=103;
const CONNECT4_CPC_RBA_METRIC_WIDTH=12;
const WITNESS_OFFSET_BYTES=0;
const RESET_OFFSET_BYTES=4;


function prepareManagedRuntimeSlab32(workers){
  const resetBytes=workers*Int32Array.BYTES_PER_ELEMENT,
    metricBaseBytes=(RESET_OFFSET_BYTES+resetBytes+7)&~7,
    metricStrideBytes=CONNECT4_CPC_RBA_METRIC_WIDTH*Float64Array.BYTES_PER_ELEMENT,
    buffer=new SharedArrayBuffer(metricBaseBytes+workers*metricStrideBytes),
    witness=new Int32Array(buffer,WITNESS_OFFSET_BYTES,1),
    resetTargets=new Int32Array(buffer,RESET_OFFSET_BYTES,workers),
    metricViews=new Array(workers);
  witness[0]=-2;
  resetTargets.fill(-2);
  for(let i=0;i<workers;i+=1)
    metricViews[i]=new Float64Array(
      buffer,
      metricBaseBytes+i*metricStrideBytes,
      CONNECT4_CPC_RBA_METRIC_WIDTH,
    );
  return {buffer,witness,resetTargets,metricViews,metricBaseBytes,metricStrideBytes};
}

export async function runManagedConnect4CpcRba32(moves,{
  geometry,
  workers=1,
  capacity=65536,
  buckets=65536,
  basisSetWords=0,
  timeoutMs=120000,
  signal,
  managerBudget=64,
  cpcFrontierResponse=false,
  cpcProjectedAdvisory=false,
}={}){
  if(!geometry)throw new TypeError('prepared Connect4 RBA geometry required');
  if(!Number.isInteger(workers)||workers<1||workers>64)
    throw new RangeError('invalid managed Connect4 worker count');
  if(!Number.isSafeInteger(capacity)||capacity<1||
     !Number.isSafeInteger(buckets)||buckets<1||(buckets&(buckets-1)))
    throw new RangeError('invalid managed Connect4 shared TT capacity');
  if(!Number.isSafeInteger(basisSetWords)||basisSetWords<0||
     (basisSetWords!==0&&basisSetWords<geometry.shapeWordCount))
    throw new RangeError('invalid managed Connect4 basis-set words');
  if(!Number.isFinite(timeoutMs)||timeoutMs<=0)
    throw new RangeError('invalid managed Connect4 timeout');
  if(!Number.isInteger(managerBudget)||managerBudget<1)
    throw new RangeError('invalid managed Connect4 manager budget');

  const root=connect4RbaFromMoves(moves,{geometry}),
    table=createRbaTt32({
      capacity,
      bucketCount:buckets,
      keyWords:geometry.keyWords,
      basisCapacity:geometry.maxBasis,
      basisSetWords,
      edgeCapacity:geometry.columns,
    }),
    rootQ=rbaTtIntern32(table,root.words,0,root.basis,0,root.basis.length);
  if(rootQ<0)throw new Error('failed to intern managed Connect4 root');
  rbaTtSetRoot32(table,rootQ);
  rbaTtEnqueue32(table,rootQ);

  const runtime=prepareManagedRuntimeSlab32(workers),
    metricOut=new Float64Array(CONNECT4_CPC_RBA_METRIC_WIDTH),
    workerGeometry=shareConnect4RbaGeometry32(geometry),
    session=createManagedThreadSession32({
      control:table.control,
      stopIndex:RBA_TT_STOP,
      doneIndex:RBA_TT_DONE,
      errorIndex:RBA_TT_ERROR,
      wakeIndex:RBA_TT_WAKE,
      workerDiedCode:HOST_WORKER_DIED,
      deadlineCode:HOST_DEADLINE,
      cancelledCode:HOST_CANCELLED,
    });

  const started=performance.now();
  try{
    spawnManagedFileWorker32(
      session,
      new URL('./rba-connect4-managed-manager.mjs',import.meta.url),
      {
        table,
        runtimeBuffer:runtime.buffer,
        resetOffsetBytes:RESET_OFFSET_BYTES,
        resetCount:workers,
        metaOffset:geometry.metaOffset,
        mirrorColumn:root.reflected?geometry.mirrorColumn:null,
        rootReflected:root.reflected,
        budget:managerBudget,
      },
    );

    for(let i=0;i<workers;i+=1){
      spawnManagedFileWorker32(
        session,
        new URL('./rba-connect4-managed-worker.mjs',import.meta.url),
        {
          table,
          geometry:workerGeometry,
          runtimeBuffer:runtime.buffer,
          resetOffsetBytes:RESET_OFFSET_BYTES,
          resetCount:workers,
          metricOffsetBytes:runtime.metricBaseBytes+i*runtime.metricStrideBytes,
          owner:i+2,
          rootReflected:root.reflected,
          cpcFrontierResponse,
          cpcProjectedAdvisory,
        },
      );
    }

    await waitManagedThreadSession32(session,{timeoutMs,signal});
  }finally{
    await closeManagedThreadSession32(session);
  }

  const elapsedMs=performance.now()-started,
    host=managedThreadSessionState32(session);
  sumMetricViews32(runtime.metricViews,CONNECT4_CPC_RBA_METRIC_WIDTH,metricOut);
  const errorCode=host.errorCode,
    exact=!errorCode&&Atomics.load(table.control,RBA_TT_DONE)===1;

  return {
    status:exact?'EXACT':
      errorCode===HOST_DEADLINE?'TIMEOUT':
      errorCode===HOST_CANCELLED?'INTERRUPTED':'FAILED',
    absoluteValue:exact?table.exact[rootQ]:0,
    witness:exact?runtime.witness[0]:-1,
    errorCode,
    errors:host.errors,
    fault:Array.from(table.fault),
    metrics:{
      claims:metricOut[0],
      branches:metricOut[1],
      evaluations:metricOut[2],
      idlePolls:metricOut[3],
      cpcCalls:metricOut[4],
      cpcExact:metricOut[5],
      cpcBounds:metricOut[6],
      cpcRestrictions:metricOut[7],
      cpcForced:metricOut[8],
      cpcPrecursors:metricOut[9],
      transitions:metricOut[10],
      readyExposure:metricOut[11],
      ttLive:table.control[RBA_TT_LIVE],
      readyCount:table.control[RBA_TT_READY_COUNT],
      eventCount:table.control[RBA_TT_EVENT_COUNT],
    },
    reflected:root.reflected,
    elapsedMs,
    cleanup:host.cleanup,
    workersExited:host.workersExited,
    sharedBytes:sharedViewBytes32(table)+runtime.buffer.byteLength+
      sharedViewBytes32(workerGeometry),
    requestedWorkers:workers,
    workersUsed:workers,
    basisSetWords,
  };
}
