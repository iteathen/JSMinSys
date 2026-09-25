import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry,shareConnect4RbaGeometry32} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves,prepareConnect4CpcRbaEvaluator} from '../addons/rba-connect4-solver.mjs';
import {
  prepareConnect4RbaAlphaBeta,
  solveConnect4RbaAlphaBeta,
  RBA_AB_CPC_ONLY,
} from '../addons/rba-connect4-alphabeta.mjs';
import {runManagedConnect4CpcRba32} from '../addons/rba-connect4-managed-host.mjs';

test('managed workers share one immutable prepared geometry image',()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6}),
    shared=shareConnect4RbaGeometry32(g);
  for(const key in g){
    const value=g[key],copy=shared[key];
    if(!ArrayBuffer.isView(value)){
      assert.equal(copy,value,key);
      continue;
    }
    assert.ok(copy.buffer instanceof SharedArrayBuffer,key+' buffer');
    assert.equal(copy.constructor,value.constructor,key+' constructor');
    assert.deepEqual([...copy],[...value],key+' contents');
  }
  assert.equal(shareConnect4RbaGeometry32(shared).lineShape.buffer,shared.lineShape.buffer);
});

test('managed path can omit physical position-code capability without changing RBA q',()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6}),
    moves=[3,2,3,2],
    coded=connect4RbaFromMoves(moves,{geometry:g,canonical:false}),
    uncoded=connect4RbaFromMoves(moves,{geometry:g,canonical:false,positionCode:false}),
    state=prepareConnect4CpcRbaEvaluator({geometry:g,positionCode:false});
  assert.deepEqual(uncoded.words,coded.words);
  assert.deepEqual(uncoded.basis,coded.basis);
  assert.equal(uncoded.positionLo,0);
  assert.equal(uncoded.positionHi,0);
  assert.equal(state.childPositionLo,null);
  assert.equal(state.childPositionHi,null);
  assert.equal(state.positionCode,0);
});

test('managed Connect4 add-on owns host/worker/manager composition without changing solver semantics',async()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:4}),
    moves=[0,1,0,1],
    root=connect4RbaFromMoves(moves,{geometry:g}),
    serial=solveConnect4RbaAlphaBeta(root,{
      state:prepareConnect4RbaAlphaBeta({
        geometry:g,
        mode:RBA_AB_CPC_ONLY,
        cacheCapacity:65536,
      }),
      reflected:root.reflected,
    });

  for(const basisSetWords of [0,g.shapeWordCount]){
    const managed=await runManagedConnect4CpcRba32(moves,{
      geometry:g,
      workers:2,
      capacity:16384,
      buckets:16384,
      basisSetWords,
      timeoutMs:5000,
    });
    assert.equal(managed.status,'EXACT',JSON.stringify(managed));
    assert.equal(managed.rootWdl,serial.value-2);
    assert.equal(managed.move,serial.move);
    assert.equal('absoluteValue' in managed,false);
    assert.equal('witness' in managed,false);
    assert.equal(managed.cleanup,true);
    assert.equal(managed.workersExited,3);
    assert.equal(managed.workersUsed,2);
    assert.ok(managed.sharedBytes>0);
    assert.ok(managed.metrics.claims>0);
    assert.ok(managed.metrics.evaluations>0);
    assert.ok(managed.metrics.transitions>0);
    assert.ok(managed.metrics.branches>0,JSON.stringify(managed));
    assert.ok(managed.metrics.claims>1,JSON.stringify(managed));
    assert.equal(managed.metrics.alphaBetaNodes,0);
    assert.equal(managed.metrics.cutoffs,0);
    assert.equal(managed.metrics.cacheHits,0);
    assert.equal(managed.metrics.cofactors,0);
    assert.equal(managed.workerClaims.length,2);
    assert.equal(managed.workerEvaluations.length,2);
    assert.ok(managed.workerClaims.every(v=>v>0),JSON.stringify(managed));
    assert.ok(managed.workerEvaluations.every(v=>v>0),JSON.stringify(managed));
  }
});


test('exact managed completion publishes worker telemetry before host cleanup',async()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6}),
    moves=[4,0,0,0,3,3,0,0,6,2,3,0,2,3,6,3,6,3,4,6,2,2,6,1,2,5,6,4],
    managed=await runManagedConnect4CpcRba32(moves,{
      geometry:g,
      workers:2,
      timeoutMs:5000,
    });
  assert.equal(managed.status,'EXACT',JSON.stringify(managed));
  assert.ok(managed.metrics.evaluations>0,JSON.stringify(managed));
  assert.ok(managed.metrics.claims>0,JSON.stringify(managed));
  assert.ok(managed.metrics.transitions>0,JSON.stringify(managed));
});
