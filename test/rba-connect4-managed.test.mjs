import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry,shareConnect4RbaGeometry32} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-solver.mjs';
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
      workers:1,
      capacity:16384,
      buckets:16384,
      basisSetWords,
      timeoutMs:5000,
    });
    assert.equal(managed.status,'EXACT',JSON.stringify(managed));
    assert.equal(managed.absoluteValue,serial.value);
    assert.equal(managed.witness,serial.move);
    assert.equal(managed.cleanup,true);
    assert.equal(managed.workersExited,2);
    assert.equal(managed.workersUsed,1);
    assert.ok(managed.sharedBytes>0);
  }
});
