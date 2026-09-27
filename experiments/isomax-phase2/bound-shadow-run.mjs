// Phase-2 shadow bound-TT census runner. Instrumented timing is invalid.
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const [libraryArg='.',movesText='353335714']=process.argv.slice(2);
const expected=new Map([
  ['353335714',{value:1,relative:1,move:4}],
  ['45461667',{value:3,relative:1,move:3}],
]).get(movesText);
if(!expected)throw new RangeError('undeclared fixture');

const library=resolve(libraryArg);
const api=await import(pathToFileURL(resolve(library,'addons/index.mjs')).href);
const g=api.prepareConnect4RbaGeometry({columns:7,rows:6});
const root=api.connect4RbaFromMoves(Array.from(movesText,ch=>ch.charCodeAt(0)-49),{geometry:g});
const state=api.prepareConnect4RbaAlphaBeta({
  geometry:g,mode:api.RBA_AB_CPC_ONLY,cacheCapacity:1048576,
  sharedExactCache:null,sharedSampleMask:0,cpcFrontierResponse:false,cpcProjectedAdvisory:false,
});
if(typeof api.prepareConnect4RbaCofactorPlanCache32==='function'){
  const planCache=api.prepareConnect4RbaCofactorPlanCache32(g,{capacity:262144});
  state.profile.cofactorPlanCache=planCache;
}
const result=api.solveConnect4RbaAlphaBeta(root,{state,reflected:root.reflected});
assert.equal(result.value,expected.value);assert.equal(result.relative,expected.relative);
if(expected.move!==undefined)assert.equal(result.move,expected.move);

const rootStats=globalThis.__ISOMAX_PHASE2_BOUND_SHADOW;
if(!rootStats?.tables)throw new Error('bound shadow hook inactive');
const trim=a=>Array.from(a).map((v,i)=>[i,v]).filter(x=>x[1]);
const summarize=t=>({
  probes:t.probes,occupiedMisses:t.occupiedMisses,hits:t.hits,
  hitRate:t.probes?t.hits/t.probes:null,
  lowerHits:t.lowerHits,upperHits:t.upperHits,
  immediateCutoffs:t.immediateCutoffs,
  cutoffPerHit:t.hits?t.immediateCutoffs/t.hits:null,
  tightens:t.tightens,noops:t.noops,
  stores:t.stores,lowerStores:t.lowerStores,upperStores:t.upperStores,
  exactProtected:t.exactProtected,overwrites:t.overwrites,
  retainedStoreFraction:t.stores?(t.stores-t.exactProtected)/t.stores:null,
  rankStores:trim(t.rankStores),rankHits:trim(t.rankHits),rankCutoffs:trim(t.rankCutoffs),
});
console.log(JSON.stringify({
  kind:'isomax-phase2-bound-shadow-v1',
  fixture:movesText,
  result:{value:result.value,relative:result.relative,move:result.move},
  productionMetrics:result.metrics,
  policies:{
    searchOnly:summarize(rootStats.tables.search),
    cpcOnly:summarize(rootStats.tables.cpc),
    combined:summarize(rootStats.tables.both),
  },
  shadowMemoryBytes:Object.values(rootStats.tables).reduce((sum,t)=>
    sum+t.used.byteLength+t.code.byteLength+t.keys.byteLength,0),
  warning:'shadow diagnostic only; it never changes alpha/beta/cache/search, so elapsed time/cycles are invalid and hit counts are upper-bound path evidence rather than a realized candidate tree'
},null,2));
