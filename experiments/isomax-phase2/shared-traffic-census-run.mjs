// Diagnostic-only 4-worker shared exact traffic census.
// Instrumented timing/cycles are invalid and must not be used for qualification.
import assert from 'node:assert/strict';
import {availableParallelism} from 'node:os';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const RANKS=43,CHANNELS=[
  'probeAttempts','probeHitLoss','probeHitDraw','probeHitWin',
  'storeLoss','storeDraw','storeWin','storeCoalescedDraw'
];
const [libraryArg,movesText='353335714',timeoutArg='90000']=process.argv.slice(2),
  library=resolve(libraryArg),timeoutMs=Number(timeoutArg);
if(!Number.isSafeInteger(timeoutMs)||timeoutMs<=0)throw new RangeError('timeoutMs');
assert.equal(availableParallelism(),4,'census requires 4-vCPU hosted topology');

const api=await import(pathToFileURL(resolve(library,'addons/index.mjs')).href);
const profile=(await import(pathToFileURL(resolve(library,'profiles/isomax-i5-12600k.json')).href,{with:{type:'json'}})).default;
const config={...profile.options,workers:4,timeoutMs};
assert.equal(config.rootFrontier,true);assert.equal(config.workers,4);

const geometry=api.prepareConnect4RbaGeometry({columns:7,rows:6}),
  moves=Array.from(movesText,ch=>ch.charCodeAt(0)-49),
  result=await api.runLazySmpConnect4Rba32(moves,{geometry,...config});

if(movesText==='353335714'){
  assert.equal(result.status,'EXACT',JSON.stringify({status:result.status,errorCode:result.errorCode,errors:result.errors}));
  assert.equal(result.rootWdl,-1);
  assert.equal(result.move,4);
}else if(!['EXACT','TIMEOUT'].includes(result.status))throw Error('unexpected status '+result.status);

const perWorker=result.sharedTrafficCensus;
if(!Array.isArray(perWorker)||perWorker.length!==4)throw Error('shared traffic census hook inactive');
const width=RANKS*CHANNELS.length,total=new Array(width).fill(0);
for(const row of perWorker){
  if(!Array.isArray(row)||row.length!==width)throw Error('invalid shared traffic census row');
  for(let i=0;i<width;i++)total[i]+=row[i];
}
const byRank=[];
for(let rank=0;rank<RANKS;rank++){
  const row={rank};
  let active=0;
  for(let c=0;c<CHANNELS.length;c++){
    const value=total[c*RANKS+rank];row[CHANNELS[c]]=value;active+=value;
  }
  row.probeHits=row.probeHitLoss+row.probeHitDraw+row.probeHitWin;
  row.probeHitRate=row.probeAttempts?row.probeHits/row.probeAttempts:null;
  row.ordinaryStores=row.storeLoss+row.storeDraw+row.storeWin;
  row.allStoreAttempts=row.ordinaryStores+row.storeCoalescedDraw;
  if(active)byRank.push(row);
}
const sum=name=>byRank.reduce((s,r)=>s+r[name],0),
  totals=Object.fromEntries(CHANNELS.map(name=>[name,sum(name)]));
totals.probeHits=totals.probeHitLoss+totals.probeHitDraw+totals.probeHitWin;
totals.probeHitRate=totals.probeAttempts?totals.probeHits/totals.probeAttempts:null;
totals.ordinaryStores=totals.storeLoss+totals.storeDraw+totals.storeWin;
totals.allStoreAttempts=totals.ordinaryStores+totals.storeCoalescedDraw;
totals.coalescedDrawStoreShare=totals.allStoreAttempts?totals.storeCoalescedDraw/totals.allStoreAttempts:null;

console.log(JSON.stringify({
  kind:'isomax-phase2-shared-traffic-census-v1',
  source:'f549dcfdd7d4d0c5ed5cd01cb3141812f1d59862',
  fixture:movesText,status:result.status,rootWdl:result.rootWdl,move:result.move,
  topology:{workers:4,wideWorker:0,deepWorkers:[1,2,3],availableParallelism:availableParallelism()},
  totalNodes:result.nodeCounts.reduce((a,b)=>a+b,0),nodeCounts:result.nodeCounts,
  sharedCacheHits:result.sharedCacheHits,sharedCacheStores:result.sharedCacheStores,
  sharedCacheStoreContention:result.sharedCacheStoreContention,
  totals,byRank,perWorker,
  warning:'diagnostic instrumentation changes execution cost/interleaving; timing and cycles are invalid'
},null,2));
