import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-solver.mjs';
import {
  prepareConnect4RbaAlphaBeta,
  solveConnect4RbaAlphaBeta,
  RBA_AB_CPC_ONLY,
} from '../addons/rba-connect4-alphabeta.mjs';
import {
  createConnect4RbaSharedExactCache32,
  probeConnect4RbaSharedExactCache32,
  storeConnect4RbaSharedExactCache32,
} from '../addons/rba-connect4-shared-exact-cache.mjs';
import {runLazySmpConnect4Rba32} from '../addons/rba-connect4-lazy-smp-host.mjs';
import {runManagedConnect4CpcRba32} from '../addons/rba-connect4-managed-host.mjs';

test('shared exact cache publishes only fully committed exact rows',()=>{
  const cache=createConnect4RbaSharedExactCache32({capacity:8,keyWords:2}),
    a=Uint32Array.from([11,22]),b=Uint32Array.from([33,44]);
  assert.equal(probeConnect4RbaSharedExactCache32(cache,a,0),0);
  assert.equal(storeConnect4RbaSharedExactCache32(cache,a,0,3),3);
  assert.equal(probeConnect4RbaSharedExactCache32(cache,a,0),3);
  storeConnect4RbaSharedExactCache32(cache,b,0,2);
  assert.ok(cache.stats[1]>=2);
});

test('Lazy SMP is a separate 2+ worker exact execution option',async()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:4}),
    moves=[0,1,0,1],
    root=connect4RbaFromMoves(moves,{geometry:g}),
    serial=solveConnect4RbaAlphaBeta(root,{
      state:prepareConnect4RbaAlphaBeta({
        geometry:g,
        mode:RBA_AB_CPC_ONLY,
        cacheCapacity:4096,
      }),
      reflected:root.reflected,
    }),
    lazy=await runLazySmpConnect4Rba32(moves,{
      geometry:g,
      workers:2,
      sharedCacheCapacity:4096,
      localCacheCapacity:4096,
      timeoutMs:5000,
    });
  assert.equal(lazy.status,'EXACT',JSON.stringify(lazy));
  assert.equal(lazy.rootWdl,serial.value-2);
  assert.equal(lazy.move,serial.move);
  assert.equal(lazy.cleanup,true);
  assert.equal(lazy.workersExited,2);
  assert.equal(lazy.workersUsed,2);
  assert.ok(lazy.winner>=0&&lazy.winner<2);
  assert.ok(lazy.sharedCacheStores>0);
  assert.ok(lazy.winnerMetrics.nodes>=0);
});

test('Lazy SMP rejects single-worker execution while Surplus runtime remains available',async()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:4});
  await assert.rejects(
    ()=>runLazySmpConnect4Rba32([0,1,0,1],{geometry:g,workers:1,timeoutMs:1000}),
    /at least two/,
  );
  const managed=await runManagedConnect4CpcRba32([0,1,0,1],{
    geometry:g,
    workers:2,
    capacity:4096,
    buckets:4096,
    timeoutMs:5000,
  });
  assert.equal(managed.status,'EXACT',JSON.stringify(managed));
});

test('Lazy SMP matches serial CPC-Negamax on a standard 7x6 late position',async()=>{
  const g=prepareConnect4RbaGeometry({columns:7,rows:6}),
    moves=[4,0,0,0,3,3,0,0,6,2,3,0,2,3,6,3,6,3,4,6,2,2,6,1,2,5,6,4],
    root=connect4RbaFromMoves(moves,{geometry:g}),
    serial=solveConnect4RbaAlphaBeta(root,{
      state:prepareConnect4RbaAlphaBeta({
        geometry:g,
        mode:RBA_AB_CPC_ONLY,
        cacheCapacity:65536,
      }),
      reflected:root.reflected,
    }),
    lazy=await runLazySmpConnect4Rba32(moves,{
      geometry:g,
      workers:2,
      sharedCacheCapacity:65536,
      localCacheCapacity:65536,
      timeoutMs:5000,
    });
  assert.equal(lazy.status,'EXACT',JSON.stringify(lazy));
  assert.equal(lazy.rootWdl,serial.value-2);
  assert.equal(lazy.move,serial.move);
  assert.equal(lazy.cleanup,true);
  assert.ok(lazy.sharedCacheStores>0);
});



test('sharing-density masks preserve exact Lazy SMP results',async()=>{
  const g=prepareConnect4RbaGeometry({columns:4,rows:4}),
    moves=[0,1,0,1],
    root=connect4RbaFromMoves(moves,{geometry:g}),
    serial=solveConnect4RbaAlphaBeta(root,{
      state:prepareConnect4RbaAlphaBeta({geometry:g,mode:RBA_AB_CPC_ONLY,cacheCapacity:4096}),
      reflected:root.reflected,
    });
  for(const sharedSampleMask of [0,1,3,7,15,31,63,127,255]){
    const lazy=await runLazySmpConnect4Rba32(moves,{
      geometry:g,workers:2,sharedCacheCapacity:4096,localCacheCapacity:4096,
      sharedSampleMask,timeoutMs:5000,
    });
    assert.equal(lazy.status,'EXACT',JSON.stringify({sharedSampleMask,lazy}));
    assert.equal(lazy.rootWdl,serial.value-2);
    assert.equal(lazy.sharedSampleMask,sharedSampleMask);
  }
});
