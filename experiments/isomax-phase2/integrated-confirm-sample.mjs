import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import {cpus} from 'node:os';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {processCycleCounter} from '../../tools/process-cycle-counter.mjs';

const [libraryArg='.',movesText='353335714']=process.argv.slice(2);
const expected=new Map([
  ['353335714',{value:1,relative:1,move:4}],
  ['45461667',{value:3,relative:1,move:3}],
]).get(movesText);
if(!expected)throw RangeError('undeclared fixture');
const library=resolve(libraryArg),git=(...args)=>execFileSync('git',['-C',library,...args],{encoding:'utf8'}).trim(),
  sourceSha=git('rev-parse','HEAD');
if(git('status','--porcelain'))throw Error('dirty source');
const api=await import(pathToFileURL(resolve(library,'addons/index.mjs')).href),
  g=api.prepareConnect4RbaGeometry({columns:7,rows:6}),
  moves=Array.from(movesText,ch=>ch.charCodeAt(0)-49),
  root=api.connect4RbaFromMoves(moves,{geometry:g}),
  state=api.prepareConnect4RbaAlphaBeta({geometry:g,mode:api.RBA_AB_CPC_ONLY,cacheCapacity:1048576,
    sharedExactCache:null,sharedSampleMask:0,cpcFrontierResponse:false,cpcProjectedAdvisory:false});
const planCache=api.prepareConnect4RbaCofactorPlanCache32(g,{capacity:262144});
state.profile.cofactorPlanCache=planCache;
const meter=await processCycleCounter();
try{
  const before=meter.read(),cpu0=process.cpuUsage(),t0=performance.now(),
    result=api.solveConnect4RbaAlphaBeta(root,{state,reflected:root.reflected}),
    wallMs=performance.now()-t0,cpu=process.cpuUsage(cpu0),after=meter.read();
  assert.equal(result.value,expected.value);assert.equal(result.relative,expected.relative);assert.equal(result.move,expected.move);
  const solveCycles=after-before,nodes=result.metrics.nodes;
  console.log(JSON.stringify({kind:'isomax-phase2-integrated-confirm-sample-v1',sourceSha,moves:movesText,
    solveCycles:String(solveCycles),cyclesPerNode:Number(solveCycles)/nodes,wallMs,cpuMs:(cpu.user+cpu.system)/1000,
    node:process.version,v8:process.versions.v8,cpu:cpus()[0]?.model??null,
    planCount:planCache.count,rssBytes:process.memoryUsage().rss,
    result:{value:result.value,relative:result.relative,move:result.move},metrics:result.metrics}));
}finally{meter.close();}
