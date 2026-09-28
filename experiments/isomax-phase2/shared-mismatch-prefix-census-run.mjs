// Diagnostic-only shared key-mismatch prefix census. Instrumented timing/cycles are invalid.
import assert from 'node:assert/strict';
import {availableParallelism} from 'node:os';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [libraryArg,movesText='353335714',timeoutArg='90000']=process.argv.slice(2),
  library=resolve(libraryArg),timeoutMs=Number(timeoutArg);
if(!Number.isSafeInteger(timeoutMs)||timeoutMs<=0)throw new RangeError('timeoutMs');
assert.equal(availableParallelism(),4);

const api=await import(pathToFileURL(resolve(library,'addons/index.mjs')).href);
const profile=(await import(pathToFileURL(resolve(library,'profiles/isomax-i5-12600k.json')).href,{with:{type:'json'}})).default;
const config={...profile.options,workers:4,timeoutMs};
assert.equal(config.rootFrontier,true);assert.equal(config.workers,4);

const geometry=api.prepareConnect4RbaGeometry({columns:7,rows:6}),
  moves=Array.from(movesText,ch=>ch.charCodeAt(0)-49),
  result=await api.runLazySmpConnect4Rba32(moves,{geometry,...config});
if(movesText==='353335714'){
  assert.equal(result.status,'EXACT',JSON.stringify(result));
  assert.equal(result.rootWdl,-1);assert.equal(result.move,4);
}else if(!['EXACT','TIMEOUT'].includes(result.status))throw Error('unexpected status '+result.status);

const raw=result.sharedMismatchPrefix;
if(!Array.isArray(raw)||raw.length!==geometry.keyWords+2)throw Error('mismatch-prefix hook inactive');
const K=geometry.keyWords,mismatch=raw.slice(0,K),fullMatches=raw[K],keyLoads=raw[K+1],
  mismatches=mismatch.reduce((a,b)=>a+b,0),compared=mismatches+fullMatches,
  weightedMismatchLoads=mismatch.reduce((s,c,i)=>s+c*(i+1),0),
  meanWordsPerCompared=compared?keyLoads/compared:null,
  meanWordsPerMismatch=mismatches?weightedMismatchLoads/mismatches:null,
  cumulative=(n)=>mismatches?mismatch.slice(0,Math.min(n+1,K)).reduce((a,b)=>a+b,0)/mismatches:null;

console.log(JSON.stringify({
  kind:'isomax-phase2-shared-mismatch-prefix-census-v1',
  fixture:movesText,status:result.status,rootWdl:result.rootWdl,move:result.move,winner:result.winner,
  topology:{workers:4,wideWorker:0,deepWorkers:[1,2,3],availableParallelism:availableParallelism()},
  keyWords:K,totalNodes:result.nodeCounts.reduce((a,b)=>a+b,0),nodeCounts:result.nodeCounts,
  sharedCacheHits:result.sharedCacheHits,sharedCacheStores:result.sharedCacheStores,
  sharedCacheStoreContention:result.sharedCacheStoreContention,
  mismatch,fullMatches,keyLoads,mismatches,compared,
  meanWordsPerCompared,meanWordsPerMismatch,
  mismatchAtWord0:mismatches?mismatch[0]/mismatches:null,
  mismatchByWord1:cumulative(1),
  mismatchByWord3:cumulative(3),
  mismatchByWord7:cumulative(7),
  warning:'diagnostic instrumentation changes execution cost/interleaving; timing, cycles, throughput and node-rate comparisons are invalid'
}));
