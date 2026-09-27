// Offline labels only. Physical ingress occurs once per externally supplied
// position/child query, never inside native recursion. Not performance evidence.
import {workerData,parentPort} from 'node:worker_threads';
import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../../addons/rba-connect4-ingress.mjs';
import {prepareConnect4RbaAlphaBeta,solveConnect4RbaAlphaBeta} from '../../addons/rba-connect4-alphabeta.mjs';
import {createConnect4RbaSharedExactCache32} from '../../addons/rba-connect4-shared-exact-cache.mjs';
import {orderFeatures,labelRanks} from './move-confidence.mjs';
import locked from '../worker-scaling/locked-profile.json' with {type:'json'};
const g=prepareConnect4RbaGeometry({columns:7,rows:6}),moves=workerData.moves,
  root=connect4RbaFromMoves(moves,{geometry:g}),features=orderFeatures(g,root);
parentPort.postMessage({type:'features',features});
const state=prepareConnect4RbaAlphaBeta({geometry:g,cacheCapacity:locked.options.localCacheCapacity,
  sharedExactCache:createConnect4RbaSharedExactCache32({capacity:locked.options.sharedCacheCapacity,keyWords:g.keyWords})});
const started=performance.now(),r=solveConnect4RbaAlphaBeta(root,{state,reflected:root.reflected}),rootMs=performance.now()-started;
assert.deepEqual(features.ordered.map(x=>x.column),Array.from(state.moveOrder.subarray(0,features.choices)));
parentPort.postMessage({type:'root',value:r.value,rootRelative:r.relative,rootMove:r.move,rootNodes:r.metrics.nodes,rootMs});
const values=Array(7).fill(null);
for(const {column} of features.raw){
  const child=connect4RbaFromMoves([...moves,column],{geometry:g});
  const result=solveConnect4RbaAlphaBeta(child,{state,reflected:child.reflected});
  values[column]=moves.length&1?2-result.value:result.value-2;
  parentPort.postMessage({type:'child',column,value:values[column],nodes:result.metrics.nodes});
}
// Negamax can return -0 for draw. WDL equality deliberately treats +/-0 alike.
const ranks=labelRanks(features,values);assert.ok(ranks.best===r.relative,'all-action WDL differs from root');
parentPort.postMessage({type:'complete',values,ranks});
