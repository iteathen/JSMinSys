// Diagnostic-only shared exact duplicate-store census. Instrumented timing is invalid.
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

const s=result.sharedDuplicateStoreStats,mismatch=result.sharedDuplicateStoreMismatch;
if(!Array.isArray(s)||s.length!==9||!Array.isArray(mismatch)||mismatch.length!==geometry.keyWords)
  throw Error('duplicate-store census hook inactive');
const [attempts,empty,busy,unstable,sameQ,sameQSameValue,sameQDifferentValue,differentQ,keyLoads]=s,
  stableOccupied=sameQ+differentQ,
  mismatchWeighted=mismatch.reduce((sum,c,i)=>sum+c*(i+1),0);

console.log(JSON.stringify({
  kind:'isomax-phase2-shared-store-duplicate-census-v1',
  fixture:movesText,status:result.status,rootWdl:result.rootWdl,move:result.move,winner:result.winner,
  topology:{workers:4,wideWorker:0,deepWorkers:[1,2,3],availableParallelism:availableParallelism()},
  keyWords:geometry.keyWords,totalNodes:result.nodeCounts.reduce((a,b)=>a+b,0),nodeCounts:result.nodeCounts,
  sharedCacheHits:result.sharedCacheHits,sharedCacheStores:result.sharedCacheStores,
  sharedCacheStoreContention:result.sharedCacheStoreContention,
  attempts,empty,busy,unstable,stableOccupied,sameQ,sameQSameValue,sameQDifferentValue,differentQ,keyLoads,mismatch,
  duplicateAttemptRate:attempts?sameQSameValue/attempts:null,
  duplicateStableOccupiedRate:stableOccupied?sameQSameValue/stableOccupied:null,
  meanDiagnosticKeyLoadsPerStableOccupied:stableOccupied?keyLoads/stableOccupied:null,
  meanMismatchWords:differentQ?mismatchWeighted/differentQ:null,
  warning:'diagnostic instrumentation changes execution cost/interleaving; timing, cycles, throughput and node-rate comparisons are invalid'
}));
