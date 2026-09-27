// Measurement-only Phase-2 recursive-search census.
// Never use instrumented elapsed time or process cycles as performance evidence.
import {registerHooks} from 'node:module';

const RANKS=43,ACTIONS=8;
const s={
  nodes:0,cacheHits:0,cpcCalls:0,cpcExact:0,cpcBound:0,cpcRestrict:0,cpcOther:0,
  cpcNoRestriction:0,cpcWindowCutoffs:0,forcedEvents:0,
  branchingNodes:0,scoredActions:0,searchedChildren:0,terminalChildren:0,
  alphaCutoffs:0,firstChildCutoffs:0,earlyWinBreaks:0,noActionNodes:0,
  rankNodes:new Float64Array(RANKS),rankCacheHits:new Float64Array(RANKS),
  rankCpcCalls:new Float64Array(RANKS),rankCpcExact:new Float64Array(RANKS),
  rankCpcBound:new Float64Array(RANKS),rankCpcRestrict:new Float64Array(RANKS),
  rankCpcOther:new Float64Array(RANKS),rankCpcNoRestriction:new Float64Array(RANKS),
  rankForced:new Float64Array(RANKS),rankBranchNodes:new Float64Array(RANKS),
  rankScoredActions:new Float64Array(RANKS),rankSearchedChildren:new Float64Array(RANKS),
  actionCountHist:new Float64Array(ACTIONS),cutoffOrdinalHist:new Float64Array(ACTIONS),
  winBreakOrdinalHist:new Float64Array(ACTIONS),
};
globalThis.__ISOMAX_PHASE2_SEARCH_CENSUS=s;
const inc=(a,i,v=1)=>{if(i>=0&&i<a.length)a[i]+=v;};
globalThis.__p2Node=rank=>{s.nodes++;inc(s.rankNodes,rank);};
globalThis.__p2CacheHit=rank=>{s.cacheHits++;inc(s.rankCacheHits,rank);};
globalThis.__p2Cpc=(rank,kind,exact,bound,restrict,forced,preemptCount)=>{
  s.cpcCalls++;inc(s.rankCpcCalls,rank);
  if(kind===exact){s.cpcExact++;inc(s.rankCpcExact,rank);}
  else if(kind===bound){s.cpcBound++;inc(s.rankCpcBound,rank);}
  else if(kind===restrict){s.cpcRestrict++;inc(s.rankCpcRestrict,rank);}
  else{
    s.cpcOther++;inc(s.rankCpcOther,rank);
    if(forced<0&&preemptCount<=1){s.cpcNoRestriction++;inc(s.rankCpcNoRestriction,rank);}
  }
};
globalThis.__p2Forced=rank=>{s.forcedEvents++;inc(s.rankForced,rank);};
globalThis.__p2Branch=(rank,count)=>{
  s.branchingNodes++;s.scoredActions+=count;inc(s.rankBranchNodes,rank);inc(s.rankScoredActions,rank,count);
  if(count>=0&&count<s.actionCountHist.length)s.actionCountHist[count]++;
};
globalThis.__p2Child=rank=>{s.searchedChildren++;inc(s.rankSearchedChildren,rank);};
globalThis.__p2Cutoff=(rank,ordinal)=>{
  s.alphaCutoffs++;if(ordinal===0)s.firstChildCutoffs++;
  if(ordinal>=0&&ordinal<s.cutoffOrdinalHist.length)s.cutoffOrdinalHist[ordinal]++;
};
globalThis.__p2EarlyWin=ordinal=>{
  s.earlyWinBreaks++;
  if(ordinal>=0&&ordinal<s.winBreakOrdinalHist.length)s.winBreakOrdinalHist[ordinal]++;
};

function rep(source,from,to,count=1){
  const actual=source.split(from).length-1;
  if(actual!==count)throw new Error('Phase2 census source guard failed: expected '+count+', got '+actual);
  return source.replace(from,to);
}

registerHooks({load(url,context,nextLoad){
  const result=nextLoad(url,context);
  if(!url.endsWith('/addons/rba-connect4-alphabeta.mjs'))return result;
  let source=typeof result.source==='string'?result.source:new TextDecoder().decode(result.source);
  source=source.replaceAll('\r\n','\n');
  const start=source.indexOf('function searchCpcOnly('),end=source.indexOf('\nfunction search(state,',start);
  if(start<0||end<0)throw new Error('Phase2 census cannot locate searchCpcOnly');
  let body=source.slice(start,end);

  body=rep(body,
    '    state.nodes+=1;\n\n    const cacheHash=',
    '    state.nodes+=1;\n    const __p2Rank=words[keyOffset+g.metaOffset]>>>2;__p2Node(__p2Rank);\n\n    const cacheHash=');
  body=rep(body,
    '    if(cached){state.cacheHits+=1;return sign*absToRelative(cached,mover);}',
    '    if(cached){state.cacheHits+=1;__p2CacheHit(__p2Rank);return sign*absToRelative(cached,mover);}');
  body=rep(body,
    '    const cpcKind=evaluateConnect4CpcNonterminal32(g,words,keyOffset,basis,basisOffset,n,state.cpc);\n    if(cpcKind===CPC_EXACT){',
    '    const cpcKind=evaluateConnect4CpcNonterminal32(g,words,keyOffset,basis,basisOffset,n,state.cpc);\n    __p2Cpc(__p2Rank,cpcKind,CPC_EXACT,CPC_BOUND,CPC_RESTRICT,state.cpc.forcedColumn[0],state.cpc.preemptionCount[0]);\n    if(cpcKind===CPC_EXACT){');
  body=rep(body,
    '    if(semanticLo>=beta){state.cutoffs+=1;return sign*semanticLo;}\n    if(semanticHi<=alpha){state.cutoffs+=1;return sign*semanticHi;}',
    '    if(semanticLo>=beta){state.cutoffs+=1;s.cpcWindowCutoffs+=1;return sign*semanticLo;}\n    if(semanticHi<=alpha){state.cutoffs+=1;s.cpcWindowCutoffs+=1;return sign*semanticHi;}');
  body=body.replaceAll('s.cpcWindowCutoffs','globalThis.__ISOMAX_PHASE2_SEARCH_CENSUS.cpcWindowCutoffs');
  body=rep(body,
    '    if(forced>=0){\n      const height=',
    '    if(forced>=0){\n      __p2Forced(__p2Rank);\n      const height=');
  body=rep(body,
    '    if(!actionCount)return 0;\n\n    let best=-2;',
    '    if(!actionCount){globalThis.__ISOMAX_PHASE2_SEARCH_CENSUS.noActionNodes+=1;return 0;}\n    __p2Branch(__p2Rank,actionCount);\n\n    let best=-2;');
  body=rep(body,
    '    for(let ai=0;ai<actionCount;ai+=1){\n      const column=',
    '    for(let ai=0;ai<actionCount;ai+=1){\n      __p2Child(__p2Rank);\n      const column=');
  body=rep(body,
    '      if(term)value=absToRelative(term,mover);\n      else{',
    '      if(term){globalThis.__ISOMAX_PHASE2_SEARCH_CENSUS.terminalChildren+=1;value=absToRelative(term,mover);}\n      else{');
  body=rep(body,
    '      if(alpha>=beta){\n        state.cutoffs+=1;',
    '      if(alpha>=beta){\n        state.cutoffs+=1;__p2Cutoff(__p2Rank,ai);');
  body=rep(body,
    '      if(best===1)break;',
    '      if(best===1){__p2EarlyWin(ai);break;}');

  source=source.slice(0,start)+body+source.slice(end);
  return {...result,source};
}});
