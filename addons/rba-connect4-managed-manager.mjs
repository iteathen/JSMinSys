import {workerData} from 'node:worker_threads';
import {reconcileConnect4CpcRbaEvent32} from './rba-connect4-solver.mjs';
import {
  prepareRbaBranchManager32,
  runRbaBranchManagerLoop32,
} from './rba-branch-manager.mjs';

const witness=new Int32Array(workerData.witnessBuffer),
  resetTargets=new Int32Array(workerData.resetBuffer),
  budget=workerData.budget??64,
  rootReflected=workerData.rootReflected?1:0,
  g={
    metaOffset:workerData.metaOffset,
    mirrorColumn:workerData.mirrorColumn,
  },
  manager=prepareRbaBranchManager32({
    capacity:workerData.table.capacity,
    resetTargets,
    budget,
  });

const reconcile=(table,q)=>
  reconcileConnect4CpcRbaEvent32(
    table,q,g,rootReflected,witness,resetTargets,0,
  );

runRbaBranchManagerLoop32(
  workerData.table,
  reconcile,
  {
    owner:1,
    budget,
    manager,
    waitMs:1,
  },
);
