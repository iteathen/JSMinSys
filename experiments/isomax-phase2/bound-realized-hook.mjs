// Stage-2 realized local zero-bound cache source specialization.
// Module loading is cold. The selected policy is compiled into the loaded
// alpha-beta source; there is no runtime experiment-mode branch in recursion.
import {registerHooks} from 'node:module';

const selected=process.env.ISOMAX_BOUND_POLICY??'search';
if(!['search','cpc','both'].includes(selected))throw new RangeError('ISOMAX_BOUND_POLICY must be search|cpc|both');

function rep(source,from,to,count=1){
  const actual=source.split(from).length-1;
  if(actual!==count)throw new Error('realized bound source guard failed: expected '+count+', got '+actual+' for '+from.slice(0,100));
  return source.replace(from,to);
}

export function transformAlphaBetaSource(input,policy=selected){
  if(!['search','cpc','both'].includes(policy))throw new RangeError('invalid bound policy');
  const useSearch=policy==='search'||policy==='both',useCpc=policy==='cpc'||policy==='both';
  let source=input.replaceAll('\r\n','\n');

  source=rep(source,
    "const MOVE_SCORE_NONE=-2147483648;",
    "const MOVE_SCORE_NONE=-2147483648;\nconst RBA_CACHE_LOWER0=4,RBA_CACHE_UPPER0=5;");

  source=rep(source,
`function storeConnect4RbaExactCacheSlot32(cache,words,offset,value,slot,hash){
  const keyWords=cache.keyWords;
  publishSpan32(cache.keys,slot*keyWords,words,offset,keyWords);
  cache.value[slot]=value;cache.stamp[slot]=cache.epoch;
  if(cache.shared&&!(hash&cache.sharedSampleBits))storeConnect4RbaSharedExactCache32(cache.shared,words,offset,value);
  return value;
}`,
`function storeConnect4RbaExactCacheSlot32(cache,words,offset,value,slot,hash){
  const keyWords=cache.keyWords;
  publishSpan32(cache.keys,slot*keyWords,words,offset,keyWords);
  cache.value[slot]=value;cache.stamp[slot]=cache.epoch;
  if(cache.shared&&!(hash&cache.sharedSampleBits))storeConnect4RbaSharedExactCache32(cache.shared,words,offset,value);
  return value;
}
function storeConnect4RbaBoundCacheSlot32(cache,words,offset,value,slot){
  // Exact rows outrank weak bounds even on a colliding q. First candidate
  // deliberately sacrifices bound coverage rather than evicting exact truth.
  if(cache.stamp[slot]===cache.epoch&&cache.value[slot]&&cache.value[slot]<=3)return 0;
  const keyWords=cache.keyWords;
  publishSpan32(cache.keys,slot*keyWords,words,offset,keyWords);
  cache.value[slot]=value;cache.stamp[slot]=cache.epoch;
  return value;
}`);

  source=rep(source,
`export function probeConnect4RbaExactCache32(cache,words,offset){
  const hash=mixSpan32Locator32(words,offset,cache.keyWords),slot=hash&cache.mask;
  return probeConnect4RbaExactCacheSlot32(cache,words,offset,slot,hash);
}`,
`export function probeConnect4RbaExactCache32(cache,words,offset){
  const hash=mixSpan32Locator32(words,offset,cache.keyWords),slot=hash&cache.mask,
    value=probeConnect4RbaExactCacheSlot32(cache,words,offset,slot,hash);
  return value<=3?value:0;
}`);

  // Generic/four-front search remains exact-only even though it shares the
  // byte carrier with the CPC-only experiment.
  source=rep(source,
`  const cached=probeConnect4RbaExactCacheSlot32(cache,words,keyOffset,cacheSlot,cacheHash);
  if(cached){state.cacheHits+=1;return absToRelative(cached,mover);}`,
`  const cached=probeConnect4RbaExactCacheSlot32(cache,words,keyOffset,cacheSlot,cacheHash);
  if(cached&&cached<=3){state.cacheHits+=1;return absToRelative(cached,mover);}`);

  const start=source.indexOf('function searchCpcOnly('),end=source.indexOf('\nfunction search(state,',start);
  if(start<0||end<0)throw new Error('realized bound transform cannot locate searchCpcOnly');
  let body=source.slice(start,end);

  body=rep(body,
`    const cached=probeConnect4RbaExactCacheSlot32(cache,words,keyOffset,cacheSlot,cacheHash);
    if(cached){state.cacheHits+=1;return sign*absToRelative(cached,mover);}`,
`    const cached=probeConnect4RbaExactCacheSlot32(cache,words,keyOffset,cacheSlot,cacheHash);
    if(cached){
      if(cached<=3){state.cacheHits+=1;return sign*absToRelative(cached,mover);}
      if(cached===RBA_CACHE_LOWER0){
        if(beta<=0){state.cutoffs+=1;return 0;}
        if(alpha<0)alpha=0;
      }else{
        if(alpha>=0){state.cutoffs+=1;return 0;}
        if(beta>0)beta=0;
      }
    }`);

  if(useCpc){
    body=rep(body,
`    if(mover===0){semanticLo=state.cpc.interval[0]-2;semanticHi=state.cpc.interval[1]-2;}
    else{semanticLo=2-state.cpc.interval[1];semanticHi=2-state.cpc.interval[0];}
    if(semanticLo===semanticHi){`,
`    if(mover===0){semanticLo=state.cpc.interval[0]-2;semanticHi=state.cpc.interval[1]-2;}
    else{semanticLo=2-state.cpc.interval[1];semanticHi=2-state.cpc.interval[0];}
    if(semanticLo===0&&semanticHi===1)
      storeConnect4RbaBoundCacheSlot32(cache,words,keyOffset,RBA_CACHE_LOWER0,cacheSlot);
    else if(semanticLo===-1&&semanticHi===0)
      storeConnect4RbaBoundCacheSlot32(cache,words,keyOffset,RBA_CACHE_UPPER0,cacheSlot);
    if(semanticLo===semanticHi){`);
  }

  if(useSearch){
    body=rep(body,
`        if(value>=beta){state.cutoffs+=1;return sign*value;}`,
`        if(value>=beta){
          if(value===0)storeConnect4RbaBoundCacheSlot32(cache,words,keyOffset,RBA_CACHE_LOWER0,cacheSlot);
          state.cutoffs+=1;return sign*value;
        }`);

    body=rep(body,
`      if(alpha>=beta){
        state.cutoffs+=1;`,
`      if(alpha>=beta){
        if(best===0)storeConnect4RbaBoundCacheSlot32(cache,words,keyOffset,RBA_CACHE_LOWER0,cacheSlot);
        state.cutoffs+=1;`);

    body=rep(body,
`    if((alphaOrig===-2&&betaOrig===2)||best===-1){
      const abs=relativeToAbs(best,mover);
      storeConnect4RbaExactCacheSlot32(cache,words,keyOffset,abs,cacheSlot,cacheHash);
    }
    return sign*best;`,
`    if((alphaOrig===-2&&betaOrig===2)||best===-1){
      const abs=relativeToAbs(best,mover);
      storeConnect4RbaExactCacheSlot32(cache,words,keyOffset,abs,cacheSlot,cacheHash);
    }else if(best===0&&alphaOrig>=0)
      storeConnect4RbaBoundCacheSlot32(cache,words,keyOffset,RBA_CACHE_UPPER0,cacheSlot);
    return sign*best;`);
  }

  source=source.slice(0,start)+body+source.slice(end);
  return source;
}

registerHooks({load(url,context,nextLoad){
  const result=nextLoad(url,context);
  if(!url.endsWith('/addons/rba-connect4-alphabeta.mjs'))return result;
  const source=typeof result.source==='string'?result.source:new TextDecoder().decode(result.source);
  return {...result,source:transformAlphaBetaSource(source,selected)};
}});
