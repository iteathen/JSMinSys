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

function solveDistributed(g,moves,basisCapacity=g.maxBasis){
  const root=connect4RbaFromMoves(moves,{geometry:g});
  const t=createRbaTt32({
    capacity:16384,bucketCount:16384,
    keyWords:g.keyWords,basisCapacity,edgeCapacity:g.columns,
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

test('derived-basis worker carries the retained child basis by row generation',()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:4}),
    root=connect4RbaFromMoves([0,1,0,1],{geometry:g}),
    t=createRbaTt32({capacity:256,bucketCount:256,keyWords:g.keyWords,basisCapacity:0,edgeCapacity:g.columns}),
    rootQ=rbaTtIntern32(t,root.words,0,root.basis,0,root.basis.length);
  rbaTtSetPositionCode32(t,rootQ,root.positionLo,root.positionHi);
  rbaTtSetRoot32(t,rootQ);rbaTtEnqueue32(t,rootQ);
  const witness=new Int32Array(1);witness[0]=-2;
  const resetTargets=new Int32Array(new SharedArrayBuffer(4));resetTargets.fill(-2);
  const state=prepareConnect4CpcRbaEvaluator({geometry:g}),
    worker=prepareRbaBranchWorker32({owner:2,workerCount:1,state,resetTargets}),
    context={rootQ,rootReflected:root.reflected,witness};
  const evaluate=(table,q,s,_expose,c)=>evaluateConnect4CpcRbaTt32(table,q,s,c.rootQ,c.rootReflected),
    publish=(table,q,owner,s,code,c)=>publishConnect4CpcRbaEvaluation32(table,q,owner,s,code,c.rootQ,c.witness,0);
  assert.equal(rbaBranchWorkerStep32(t,worker,evaluate,publish,context),1);
  assert.ok(worker.q>=0,'root did not retain an unresolved child');
  assert.equal(state.basisQ,worker.q);
  assert.equal(state.basisGeneration,t.generation[worker.q]);
  const retained=worker.q;
  evaluateConnect4CpcRbaTt32(t,retained,state,rootQ,root.reflected);
  assert.equal(state.basisQ,-1,'retained basis assertion was not consumed');
});

test('support-derived TT basis closes a late standard 7x6 control exactly',()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6}),
    moves=[4,0,0,0,3,3,0,0,6,2,3,0,2,3,6,3,6,3,4,6,2,2,6,1,2,5,6,4],
    root=connect4RbaFromMoves(moves,{geometry:g}),
    serial=solveConnect4RbaAlphaBeta(root,{
      state:prepareConnect4RbaAlphaBeta({geometry:g,mode:RBA_AB_CPC_ONLY,cacheCapacity:65536}),
      reflected:root.reflected,
    }),
    stored=solveDistributed(g,moves,g.maxBasis),
    derived=solveDistributed(g,moves,0);
  assert.equal(stored.value,serial.value,JSON.stringify({serial,stored}));
  assert.equal(stored.move,serial.move,JSON.stringify({serial,stored}));
  assert.equal(derived.value,serial.value,JSON.stringify({serial,derived}));
  assert.equal(derived.move,serial.move,JSON.stringify({serial,derived}));
  assert.equal(derived.basisBytes,0);
});

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
    const distributed=solveDistributed(g,moves),derived=solveDistributed(g,moves,0);
    assert.equal(distributed.value,serial.value,JSON.stringify({moves,serial,distributed}));
    assert.equal(distributed.move,serial.move,JSON.stringify({moves,serial,distributed}));
    assert.equal(derived.value,serial.value,JSON.stringify({moves,serial,derived}));
    assert.equal(derived.move,serial.move,JSON.stringify({moves,serial,derived}));
    assert.ok(distributed.claims>0);assert.ok(derived.claims>0);
    assert.ok(distributed.basisBytes>0);assert.equal(derived.basisBytes,0);
  }
});
