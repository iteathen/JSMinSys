import {workerData} from 'node:worker_threads';
import {prepareConnect4RbaGeometry} from './rba-connect4-geometry.mjs';
import {reconcileConnect4CpcRbaEvent32} from './rba-connect4-solver.mjs';
import {
  prepareRbaBranchManager32,
  runRbaBranchManagerLoop32,
} from './rba-branch-manager.mjs';

const g=prepareConnect4RbaGeometry(workerData.geometryConfig),
  witness=new Int32Array(workerData.witnessBuffer),
  resetTargets=new Int32Array(workerData.resetBuffer),
  budget=workerData.budget??64,
  manager=prepareRbaBranchManager32({
    capacity:workerData.table.capacity,
    resetTargets,
    budget,
  }),
  context={
    g,
    rootReflected:workerData.rootReflected?1:0,
    witness,
    resetTargets,
  };

const reconcile=(table,q,c)=>
  reconcileConnect4CpcRbaEvent32(
    table,q,c.g,c.rootReflected,c.witness,c.resetTargets,0,
  );

runRbaBranchManagerLoop32(
  workerData.table,
  reconcile,
  {
    owner:1,
    budget,
    context,
    manager,
    waitMs:1,
  },
);
