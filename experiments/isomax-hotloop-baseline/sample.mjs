// Cold single-evaluator IsoMax sample. Measurement code is outside the solver hot loop.
import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {cpus} from 'node:os';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {processCycleCounter} from '../../tools/process-cycle-counter.mjs';

const [libraryArg='.', cacheMode='local', movesText='45461667'] = process.argv.slice(2);
if(!['local','shared'].includes(cacheMode)) throw new RangeError('cache mode must be local|shared');
if(!/^[1-7]*$/.test(movesText)) throw new RangeError('moves must contain only 1..7');

const fixtures = new Map([
  ['45461667',{value:3,relative:1,move:3}],
  // Derived child of official 35333571. Parent is an absolute P0 loss; after the
  // appended legal P0 move it remains P0 loss, with P1 to move.
  ['353335714',{value:1,relative:1}],
]);
const expected=fixtures.get(movesText);
if(!expected) throw new RangeError('fixture is not declared by this experiment');

const library=resolve(libraryArg);
const git=(...args)=>execFileSync('git',['-C',library,...args],{encoding:'utf8'}).trim();
const sourceSha=git('rev-parse','HEAD');
if(git('status','--porcelain')) throw new Error('library checkout must be clean');

const api=await import(pathToFileURL(resolve(library,'addons/index.mjs')).href);
const {
  prepareConnect4RbaGeometry,
  connect4RbaFromMoves,
  prepareConnect4RbaAlphaBeta,
  solveConnect4RbaAlphaBeta,
  createConnect4RbaSharedExactCache32,
  RBA_AB_CPC_ONLY,
}=api;

const geometry=prepareConnect4RbaGeometry({columns:7,rows:6});
const moves=Array.from(movesText,ch=>ch.charCodeAt(0)-49);
const root=connect4RbaFromMoves(moves,{geometry});
const sharedExactCache=cacheMode==='shared'
  ?createConnect4RbaSharedExactCache32({capacity:4194304,keyWords:geometry.keyWords})
  :null;
const state=prepareConnect4RbaAlphaBeta({
  geometry,
  mode:RBA_AB_CPC_ONLY,
  cacheCapacity:1048576,
  sharedExactCache,
  sharedSampleMask:0,
  cpcFrontierResponse:false,
  cpcProjectedAdvisory:false,
});

const meter=await processCycleCounter();
try{
  const before=meter.read(),cpuBefore=process.cpuUsage(),started=performance.now();
  const result=solveConnect4RbaAlphaBeta(root,{state,reflected:root.reflected});
  const wallMs=performance.now()-started,cpu=process.cpuUsage(cpuBefore),after=meter.read();
  assert.equal(result.value,expected.value,'absolute WDL drift');
  assert.equal(result.relative,expected.relative,'relative WDL drift');
  if(expected.move!==undefined) assert.equal(result.move,expected.move,'root move drift');
  const solveCycles=after-before,nodes=result.metrics.nodes;
  if(!Number.isSafeInteger(nodes)||nodes<=0) throw new Error('invalid node count');
  console.log(JSON.stringify({
    kind:'isomax-hotloop-baseline-sample-v1',
    sourceSha,
    cacheMode,
    moves:movesText,
    node:process.version,
    v8:process.versions.v8,
    cpu:cpus()[0]?.model??null,
    localCacheCapacity:1048576,
    sharedCacheCapacity:sharedExactCache?4194304:0,
    sharedSampleMask:0,
    solveCycles:String(solveCycles),
    wallMs,
    cpuMs:(cpu.user+cpu.system)/1000,
    cyclesPerNode:Number(solveCycles)/nodes,
    result:{value:result.value,relative:result.relative,move:result.move},
    metrics:result.metrics,
    sharedStats:sharedExactCache?Array.from(sharedExactCache.stats):null,
    rssBytes:process.memoryUsage().rss,
  }));
} finally {
  meter.close();
}
