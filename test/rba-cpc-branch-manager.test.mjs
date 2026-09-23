import test from 'node:test';
import assert from 'node:assert/strict';
import {
  prepareConnect4RbaGeometry,
} from '../addons/rba-connect4-geometry.mjs';
import {
  connect4RbaFromMoves,
  prepareConnect4CpcRbaEvaluator,
  evaluateConnect4CpcRbaTt32,
  publishConnect4CpcRbaEvaluation32,
  reconcileConnect4CpcRbaEvent32,
} from '../addons/rba-connect4-solver.mjs';
import {
  prepareConnect4RbaAlphaBeta,
  solveConnect4RbaAlphaBeta,
  RBA_AB_CPC_ONLY,
} from '../addons/rba-connect4-alphabeta.mjs';
import {
  createRbaTt32,rbaTtIntern32,rbaTtSetRoot32,rbaTtEnqueue32,
  RBA_TT_DONE,
} from '../addons/rba-tt32.mjs';
import {
  prepareRbaBranchWorker32,prepareRbaBranchManager32,rbaBranchWorkerStep32,rbaBranchManagerStep32,
} from '../addons/rba-branch-manager.mjs';

function solveDistributed(g,moves){
  const root=connect4RbaFromMoves(moves,{geometry:g});
  const t=createRbaTt32({
    capacity:16384,bucketCount:16384,
    keyWords:g.keyWords,basisCapacity:g.maxBasis,edgeCapacity:g.columns,
  });
  const rootQ=rbaTtIntern32(t,root.words,0,root.basis,0,root.basis.length);
  rbaTtSetRoot32(t,rootQ);
  rbaTtEnqueue32(t,rootQ);
  const witness=new Int32Array(1);witness[0]=-2;
  const resetTargets=new Int32Array(new SharedArrayBuffer(4));resetTargets.fill(-2);
  const state=prepareConnect4CpcRbaEvaluator({geometry:g});
  const worker=prepareRbaBranchWorker32({owner:2,workerCount:2,state,resetTargets});
  const manager=prepareRbaBranchManager32({capacity:t.capacity,resetTargets});
  const context={rootQ,rootReflected:root.reflected,witness,g,resetTargets};

  const evaluate=(table,q,s,_expose,c)=>
    evaluateConnect4CpcRbaTt32(table,q,s,c.rootQ,c.rootReflected);
  const publish=(table,q,owner,s,code,c)=>
    publishConnect4CpcRbaEvaluation32(table,q,owner,s,code,c.rootQ,c.witness,0);
  const reconcile=(table,q,c)=>
    reconcileConnect4CpcRbaEvent32(table,q,c.g,c.rootReflected,c.witness,c.resetTargets,0);

  let turns=0;
  while(!Atomics.load(t.control,RBA_TT_DONE)&&turns<200000){
    const a=rbaBranchWorkerStep32(t,worker,evaluate,publish,context);
    const b=rbaBranchManagerStep32(t,reconcile,{context,manager});
    if(!a&&!b&&worker.q===-1)throw new Error('distributed RBA stalled');
    turns+=1;
  }
  if(!Atomics.load(t.control,RBA_TT_DONE))throw new Error('distributed RBA turn limit');
  return {
    value:t.exact[rootQ],
    move:witness[0],
    turns,
    claims:worker.claims,
    branches:worker.branches,
    evaluations:worker.evaluations,
  };
}

test('CPC-first branch-manager traversal agrees with exact CPC alpha-beta on 4x4 controls',()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:4});
  const fixtures=[
    [0,1,0,1],
    [1,2,1,2,0,3],
    [0,1,1,3,2],
    [2,1,2,0,3,1],
    [0,3,1,3,2,0,2],
  ];
  for(const moves of fixtures){
    const root=connect4RbaFromMoves(moves,{geometry:g});
    const serial=solveConnect4RbaAlphaBeta(root,{
      state:prepareConnect4RbaAlphaBeta({geometry:g,mode:RBA_AB_CPC_ONLY,cacheCapacity:65536}),
      reflected:root.reflected,
    });
    const distributed=solveDistributed(g,moves);
    assert.equal(distributed.value,serial.value,JSON.stringify({moves,serial,distributed}));
    assert.equal(distributed.move,serial.move,JSON.stringify({moves,serial,distributed}));
    assert.ok(distributed.claims>0);
  }
});
