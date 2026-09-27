// Measurement-only Phase-2 shadow zero-bound TT census.
// It does not change alpha, beta, return values, cache contents, or search order.
// Instrumented timing/cycles are invalid.
import {registerHooks} from 'node:module';

const LOWER0=1,UPPER0=2,RANKS=43;
const root={tables:null};
globalThis.__ISOMAX_PHASE2_BOUND_SHADOW=root;

function table(name,capacity,keyWords){
  return {
    name,capacity,keyWords,
    used:new Uint8Array(capacity),
    code:new Uint8Array(capacity),
    keys:new Uint32Array(capacity*keyWords),
    probes:0,occupiedMisses:0,hits:0,lowerHits:0,upperHits:0,
    immediateCutoffs:0,tightens:0,noops:0,
    stores:0,lowerStores:0,upperStores:0,exactProtected:0,overwrites:0,
    rankStores:new Float64Array(RANKS),rankHits:new Float64Array(RANKS),rankCutoffs:new Float64Array(RANKS),
  };
}
function ensure(cache){
  if(root.tables)return root.tables;
  const capacity=cache.mask+1,keyWords=cache.keyWords;
  root.tables={
    search:table('search',capacity,keyWords),
    cpc:table('cpc',capacity,keyWords),
    both:table('both',capacity,keyWords),
  };
  return root.tables;
}
function sameKey(t,slot,words,offset){
  const base=slot*t.keyWords;
  for(let w=0;w<t.keyWords;w+=1)if(t.keys[base+w]!==words[offset+w])return false;
  return true;
}
function copyKey(t,slot,words,offset){
  const base=slot*t.keyWords;
  for(let w=0;w<t.keyWords;w+=1)t.keys[base+w]=words[offset+w];
}
function storeOne(t,cache,words,offset,slot,code,rank){
  t.stores+=1;if(code===LOWER0)t.lowerStores+=1;else t.upperStores+=1;
  if(rank>=0&&rank<RANKS)t.rankStores[rank]+=1;
  // Exact information wins the slot. A shadow bound never evicts a live exact row.
  if(cache.stamp[slot]===cache.epoch&&cache.value[slot]>=1&&cache.value[slot]<=3){
    t.exactProtected+=1;return;
  }
  if(t.used[slot])t.overwrites+=1;
  copyKey(t,slot,words,offset);t.code[slot]=code;t.used[slot]=1;
}
function probeOne(t,words,offset,slot,alpha,beta,rank){
  t.probes+=1;
  if(!t.used[slot])return;
  if(!sameKey(t,slot,words,offset)){t.occupiedMisses+=1;return;}
  t.hits+=1;if(rank>=0&&rank<RANKS)t.rankHits[rank]+=1;
  const code=t.code[slot];
  if(code===LOWER0){
    t.lowerHits+=1;
    if(beta<=0){t.immediateCutoffs+=1;if(rank>=0&&rank<RANKS)t.rankCutoffs[rank]+=1;}
    else if(alpha<0)t.tightens+=1;
    else t.noops+=1;
  }else{
    t.upperHits+=1;
    if(alpha>=0){t.immediateCutoffs+=1;if(rank>=0&&rank<RANKS)t.rankCutoffs[rank]+=1;}
    else if(beta>0)t.tightens+=1;
    else t.noops+=1;
  }
}
globalThis.__p2BoundProbeAll=(cache,words,offset,slot,alpha,beta,rank)=>{
  const ts=ensure(cache);
  probeOne(ts.search,words,offset,slot,alpha,beta,rank);
  probeOne(ts.cpc,words,offset,slot,alpha,beta,rank);
  probeOne(ts.both,words,offset,slot,alpha,beta,rank);
};
globalThis.__p2BoundStoreCpc=(cache,words,offset,slot,lo,hi,rank)=>{
  let code=0;if(lo===0&&hi===1)code=LOWER0;else if(lo===-1&&hi===0)code=UPPER0;
  if(!code)return;
  const ts=ensure(cache);
  storeOne(ts.cpc,cache,words,offset,slot,code,rank);
  storeOne(ts.both,cache,words,offset,slot,code,rank);
};
globalThis.__p2BoundStoreSearch=(cache,words,offset,slot,code,rank)=>{
  const ts=ensure(cache);
  storeOne(ts.search,cache,words,offset,slot,code,rank);
  storeOne(ts.both,cache,words,offset,slot,code,rank);
};

function rep(source,from,to,count=1){
  const actual=source.split(from).length-1;
  if(actual!==count)throw new Error('bound shadow source guard failed: expected '+count+', got '+actual);
  return source.replace(from,to);
}

registerHooks({load(url,context,nextLoad){
  const result=nextLoad(url,context);
  if(!url.endsWith('/addons/rba-connect4-alphabeta.mjs'))return result;
  let source=typeof result.source==='string'?result.source:new TextDecoder().decode(result.source);
  source=source.replaceAll('\r\n','\n');
  const start=source.indexOf('function searchCpcOnly('),end=source.indexOf('\nfunction search(state,',start);
  if(start<0||end<0)throw new Error('bound shadow cannot locate searchCpcOnly');
  let body=source.slice(start,end);

  body=rep(body,
    '    state.nodes+=1;\n\n    const cacheHash=',
    '    state.nodes+=1;\n    const __bRank=words[keyOffset+g.metaOffset]>>>2;\n\n    const cacheHash=');

  body=rep(body,
    '    const cached=probeConnect4RbaExactCacheSlot32(cache,words,keyOffset,cacheSlot,cacheHash);\n    if(cached){state.cacheHits+=1;return sign*absToRelative(cached,mover);}',
    '    const cached=probeConnect4RbaExactCacheSlot32(cache,words,keyOffset,cacheSlot,cacheHash);\n    if(cached){state.cacheHits+=1;return sign*absToRelative(cached,mover);}\n    __p2BoundProbeAll(cache,words,keyOffset,cacheSlot,alpha,beta,__bRank);');

  body=rep(body,
    '    if(mover===0){semanticLo=state.cpc.interval[0]-2;semanticHi=state.cpc.interval[1]-2;}\n    else{semanticLo=2-state.cpc.interval[1];semanticHi=2-state.cpc.interval[0];}\n    if(semanticLo===semanticHi){',
    '    if(mover===0){semanticLo=state.cpc.interval[0]-2;semanticHi=state.cpc.interval[1]-2;}\n    else{semanticLo=2-state.cpc.interval[1];semanticHi=2-state.cpc.interval[0];}\n    __p2BoundStoreCpc(cache,words,keyOffset,cacheSlot,semanticLo,semanticHi,__bRank);\n    if(semanticLo===semanticHi){');

  body=rep(body,
    '        if(value>=beta){state.cutoffs+=1;return sign*value;}',
    '        if(value>=beta){if(value===0)__p2BoundStoreSearch(cache,words,keyOffset,cacheSlot,1,__bRank);state.cutoffs+=1;return sign*value;}');

  body=rep(body,
    '      if(alpha>=beta){\n        state.cutoffs+=1;',
    '      if(alpha>=beta){\n        if(best===0)__p2BoundStoreSearch(cache,words,keyOffset,cacheSlot,1,__bRank);\n        state.cutoffs+=1;');

  body=rep(body,
    '    if((alphaOrig===-2&&betaOrig===2)||best===-1){\n      const abs=relativeToAbs(best,mover);\n      storeConnect4RbaExactCacheSlot32(cache,words,keyOffset,abs,cacheSlot,cacheHash);\n    }\n    return sign*best;',
    '    if((alphaOrig===-2&&betaOrig===2)||best===-1){\n      const abs=relativeToAbs(best,mover);\n      storeConnect4RbaExactCacheSlot32(cache,words,keyOffset,abs,cacheSlot,cacheHash);\n    }else if(best===0&&alphaOrig>=0)__p2BoundStoreSearch(cache,words,keyOffset,cacheSlot,2,__bRank);\n    return sign*best;');

  source=source.slice(0,start)+body+source.slice(end);
  return {...result,source};
}});
