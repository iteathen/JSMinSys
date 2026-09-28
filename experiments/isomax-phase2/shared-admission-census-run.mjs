// Diagnostic-only shared admission/source census. Instrumented timing is invalid.
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
assert.equal(availableParallelism(),4);

const geometry=api.prepareConnect4RbaGeometry({columns:7,rows:6}),
  moves=Array.from(movesText,ch=>ch.charCodeAt(0)-49),
  result=await api.runLazySmpConnect4Rba32(moves,{geometry,...config});
if(movesText==='353335714'){
  assert.equal(result.status,'EXACT',JSON.stringify(result));
  assert.equal(result.rootWdl,-1);assert.equal(result.move,4);
}else if(!['EXACT','TIMEOUT'].includes(result.status))throw Error('unexpected status '+result.status);

const census=result.sharedAdmissionCensus;
if(!census)throw Error('admission census hook inactive');
const sourceLabels=[
  'unclassified',
  'cpc-exact',
  'semantic-collapse',
  'forced-terminal-full-window',
  'directed-fail-high-win',
  'completed-exact-branch',
  'coalesced-exact-draw',
],SOURCE_WIDTH=8,DEPTH_WIDTH=3,READER_WIDTH=3;
const sources=sourceLabels.map((label,id)=>{
  const b=id*SOURCE_WIDTH,
    attempts=census.sourceStats[b],successes=census.sourceStats[b+1],contentions=census.sourceStats[b+2],
    replacements=census.sourceStats[b+3],sameSourceReplacements=census.sourceStats[b+4],
    hits=census.sourceStats[b+5],crossWorkerHits=census.sourceStats[b+6],evictions=census.sourceStats[b+7];
  return {id,label,attempts,successes,contentions,replacements,sameSourceReplacements,hits,crossWorkerHits,evictions,
    successRate:attempts?successes/attempts:null,contentionRate:attempts?contentions/attempts:null,
    replacementRate:successes?replacements/successes:null,hitPerSuccess:successes?hits/successes:null,
    crossWorkerHitRate:hits?crossWorkerHits/hits:null};
});
const depths=[];
for(let depth=0;depth<43;depth++){
  const b=depth*DEPTH_WIDTH,successes=census.depthStats[b],hits=census.depthStats[b+1],attempts=census.depthStats[b+2];
  if(attempts||successes||hits)depths.push({depth,attempts,successes,hits,hitPerSuccess:successes?hits/successes:null});
}
const readers=[];
for(let worker=0;worker<4;worker++){
  const b=worker*READER_WIDTH,probes=census.readerStats[b],hits=census.readerStats[b+1],crossWorkerHits=census.readerStats[b+2];
  readers.push({worker,role:worker===0?'wide':'deep',probes,hits,crossWorkerHits,
    hitRate:probes?hits/probes:null,crossWorkerHitRate:hits?crossWorkerHits/hits:null});
}
const [probes,empty,busy,keyMismatch,unstable,hits]=census.probeStats;
console.log(JSON.stringify({
  kind:'isomax-phase2-shared-admission-census-v1',
  fixture:movesText,status:result.status,rootWdl:result.rootWdl,move:result.move,winner:result.winner,
  topology:{workers:4,wideWorker:0,deepWorkers:[1,2,3],availableParallelism:availableParallelism()},
  totalNodes:result.nodeCounts.reduce((a,b)=>a+b,0),nodeCounts:result.nodeCounts,
  sharedCacheHits:result.sharedCacheHits,sharedCacheStores:result.sharedCacheStores,
  sharedCacheStoreContention:result.sharedCacheStoreContention,
  probes:{total:probes,empty,busy,keyMismatch,unstable,hits,hitRate:probes?hits/probes:null},
  sources,depths,readers,
  warning:'diagnostic instrumentation changes execution cost/interleaving; timing, cycles, throughput and node-rate comparisons are invalid'
}));
