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
  createRbaTt32,rbaTtIntern32,rbaTtSetPositionCode32,rbaTtSetRoot32,rbaTtEnqueue32,
  RBA_TT_DONE,
} from '../addons/rba-tt32.mjs';
import {
  prepareRbaBranchWorker32,prepareRbaBranchManager32,rbaBranchWorkerStep32,rbaBranchManagerStep32,
} from '../addons/rba-branch-manager.mjs';

function assertOptimalWitness(g,moves,result,expectedValue){
  assert.ok(result.move>=0&&result.move<g.columns,JSON.stringify({moves,result}));
  const next=[...moves,result.move],root=connect4RbaFromMoves(next,{geometry:g}),
    solved=solveConnect4RbaAlphaBeta(root,{
      state:prepareConnect4RbaAlphaBeta({geometry:g,mode:RBA_AB_CPC_ONLY,cacheCapacity:65536}),
      reflected:root.reflected,
    });
  assert.equal(solved.value,expectedValue,JSON.stringify({moves,result,solved}));
}

function solveDistributed(g,moves,basisSetWords=0){
  const root=connect4RbaFromMoves(moves,{geometry:g});
  const t=createRbaTt32({
    capacity:16384,bucketCount:16384,
    keyWords:g.keyWords,basisCapacity:g.maxBasis,basisSetWords,edgeCapacity:g.columns,
  });
  const rootQ=rbaTtIntern32(t,root.words,0,root.basis,0,root.basis.length);
  rbaTtSetPositionCode32(t,rootQ,root.positionLo,root.positionHi);
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
    basisBytes:t.basis.byteLength,
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
    const distributed=solveDistributed(g,moves),compact=solveDistributed(g,moves,g.shapeWordCount);
    assert.equal(distributed.value,serial.value,JSON.stringify({moves,serial,distributed}));
    assertOptimalWitness(g,moves,distributed,serial.value);
    assert.equal(compact.value,serial.value,JSON.stringify({moves,serial,compact}));
    assertOptimalWitness(g,moves,compact,serial.value);
    assert.ok(distributed.claims>0);assert.ok(compact.claims>0);
    assert.equal(compact.basisBytes/distributed.basisBytes,g.shapeWordCount/g.maxBasis);
  }
});
