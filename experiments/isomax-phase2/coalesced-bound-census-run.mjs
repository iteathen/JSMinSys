// Diagnostic-only 4-worker coalesced-bound census. Instrumented time is invalid.
import assert from 'node:assert/strict';
import {availableParallelism} from 'node:os';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [libraryArg,movesText='353335714',timeoutArg='90000']=process.argv.slice(2),
  library=resolve(libraryArg),timeoutMs=Number(timeoutArg);
if(!Number.isSafeInteger(timeoutMs)||timeoutMs<=0)throw new RangeError('timeoutMs');

const api=await import(pathToFileURL(resolve(library,'addons/index.mjs')).href);
const profile=(await import(pathToFileURL(resolve(library,'profiles/isomax-i5-12600k.json')).href,{with:{type:'json'}})).default;
const config={...profile.options,workers:4,timeoutMs};
assert.equal(config.rootFrontier,true);assert.equal(config.workers,4);

const geometry=api.prepareConnect4RbaGeometry({columns:7,rows:6}),
  moves=Array.from(movesText,ch=>ch.charCodeAt(0)-49),
  result=await api.runLazySmpConnect4Rba32(moves,{geometry,...config});

if(result.status==='FAILED'){
  console.log(JSON.stringify({
    kind:'isomax-phase2-coalesced-bound-census-failure-v1',
    fixture:movesText,status:result.status,errorCode:result.errorCode,
    errors:result.errors,cleanup:result.cleanup,workersExited:result.workersExited,
    completedWorkers:result.completedWorkers,nodeCounts:result.nodeCounts,
    boundCensus:result.boundCensus
  },null,2));
  process.exitCode=2;
}else if(movesText==='353335714'){
  assert.equal(result.status,'EXACT');
  assert.equal(result.rootWdl,-1);
  assert.equal(result.move,4);
}else if(!['EXACT','TIMEOUT'].includes(result.status))throw Error('unexpected status '+result.status);

if(result.status==='FAILED')process.exit();
const perWorker=result.boundCensus;
if(!Array.isArray(perWorker)||perWorker.length!==4)throw Error('census hook inactive');
const total=new Array(7).fill(0);
for(const row of perWorker){
  if(!Array.isArray(row)||row.length!==7)throw Error('invalid worker census row');
  for(let i=0;i<7;i++)total[i]+=row[i];
}
const [storeAttempts,sameSuppressed,drawPromotions,exactProtected,hitCutoffs,hitTightens,hitNoops]=total,
  freshPublishes=storeAttempts-sameSuppressed-drawPromotions-exactProtected,
  hitTotal=hitCutoffs+hitTightens+hitNoops;

console.log(JSON.stringify({
  kind:'isomax-phase2-coalesced-bound-census-v1',
  fixture:movesText,status:result.status,rootWdl:result.rootWdl,move:result.move,
  topology:{workers:4,wideWorker:0,deepWorkers:[1,2,3],availableParallelism:availableParallelism()},
  totalNodes:result.nodeCounts.reduce((a,b)=>a+b,0),nodeCounts:result.nodeCounts,
  sharedCacheHits:result.sharedCacheHits,sharedCacheStores:result.sharedCacheStores,
  perWorker,
  counters:{
    storeAttempts,sameSuppressed,drawPromotions,exactProtected,freshPublishes,
    hitCutoffs,hitTightens,hitNoops,hitTotal,
    sameSuppressionRate:storeAttempts?sameSuppressed/storeAttempts:null,
    drawPromotionRate:storeAttempts?drawPromotions/storeAttempts:null,
    exactProtectedRate:storeAttempts?exactProtected/storeAttempts:null,
    freshPublishRate:storeAttempts?freshPublishes/storeAttempts:null,
    cutoffPerBoundHit:hitTotal?hitCutoffs/hitTotal:null,
    tightenPerBoundHit:hitTotal?hitTightens/hitTotal:null,
    noopPerBoundHit:hitTotal?hitNoops/hitTotal:null
  },
  warning:'diagnostic instrumentation changes execution cost/interleaving; timing and cycles are invalid'
},null,2));
