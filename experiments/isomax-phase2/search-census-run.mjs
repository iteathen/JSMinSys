// Phase-2 measurement-only search census runner. Instrumented timing is invalid.
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
const moves=Array.from(movesText,ch=>ch.charCodeAt(0)-49);
const root=api.connect4RbaFromMoves(moves,{geometry:g});
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

const s=globalThis.__ISOMAX_PHASE2_SEARCH_CENSUS;
if(!s)throw new Error('Phase2 search census hook inactive');
const trim=a=>Array.from(a).map((v,i)=>[i,v]).filter(x=>x[1]);
const unsearchedScored=s.scoredActions-s.searchedChildren;
console.log(JSON.stringify({
  kind:'isomax-phase2-search-census-v1',
  fixture:movesText,
  result:{value:result.value,relative:result.relative,move:result.move},
  productionMetrics:result.metrics,
  census:{
    nodes:s.nodes,cacheHits:s.cacheHits,
    cpcCalls:s.cpcCalls,cpcExact:s.cpcExact,cpcBound:s.cpcBound,cpcRestrict:s.cpcRestrict,
    cpcOther:s.cpcOther,cpcNoRestriction:s.cpcNoRestriction,cpcWindowCutoffs:s.cpcWindowCutoffs,
    forcedEvents:s.forcedEvents,
    branchingNodes:s.branchingNodes,scoredActions:s.scoredActions,searchedChildren:s.searchedChildren,
    unsearchedScored,unsearchedScoredFraction:s.scoredActions?unsearchedScored/s.scoredActions:null,
    terminalChildren:s.terminalChildren,
    alphaCutoffs:s.alphaCutoffs,firstChildCutoffs:s.firstChildCutoffs,
    firstChildCutoffFraction:s.alphaCutoffs?s.firstChildCutoffs/s.alphaCutoffs:null,
    earlyWinBreaks:s.earlyWinBreaks,noActionNodes:s.noActionNodes,
    actionCountHist:Array.from(s.actionCountHist),
    cutoffOrdinalHist:Array.from(s.cutoffOrdinalHist),
    winBreakOrdinalHist:Array.from(s.winBreakOrdinalHist),
    rankNodes:trim(s.rankNodes),rankCacheHits:trim(s.rankCacheHits),
    rankCpcCalls:trim(s.rankCpcCalls),rankCpcExact:trim(s.rankCpcExact),
    rankCpcBound:trim(s.rankCpcBound),rankCpcRestrict:trim(s.rankCpcRestrict),
    rankCpcOther:trim(s.rankCpcOther),rankCpcNoRestriction:trim(s.rankCpcNoRestriction),
    rankForced:trim(s.rankForced),rankBranchNodes:trim(s.rankBranchNodes),
    rankScoredActions:trim(s.rankScoredActions),rankSearchedChildren:trim(s.rankSearchedChildren),
  },
  warning:'measurement-only source-hook census; instrumented elapsed time/cycles are invalid'
},null,2));
