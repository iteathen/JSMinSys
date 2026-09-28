// Diagnostic-only Phase-2 shared admission/source census.
// Instrumented timing/cycles/nodes-per-second are invalid.
import {registerHooks} from 'node:module';

const SOURCE_COUNT=7,SOURCE_WIDTH=8,DEPTH_COUNT=43,DEPTH_WIDTH=3,READER_COUNT=4,READER_WIDTH=3,PUBLISHER_COUNT=4,PUBLISHER_WIDTH=7;

function rep(source,from,to,count=1){
  const actual=source.split(from).length-1;
  if(actual!==count)throw new Error('shared admission census source guard '+actual+'/'+count+' for '+from.slice(0,96));
  return source.replace(from,to);
}

registerHooks({load(url,context,nextLoad){
  const result=nextLoad(url,context);
  const target=url.endsWith('/addons/rba-connect4-shared-exact-cache.mjs')||
    url.endsWith('/addons/rba-connect4-frontier.mjs')||
    url.endsWith('/addons/rba-connect4-lazy-smp-worker-frontier.mjs')||
    url.endsWith('/addons/rba-connect4-lazy-smp-host.mjs');
  if(!target||result.source===null||result.source===undefined)return result;
  let source=typeof result.source==='string'?result.source:new TextDecoder().decode(result.source);
  source=source.replaceAll('\r\n','\n');

  if(url.endsWith('/addons/rba-connect4-shared-exact-cache.mjs')){
    source='const __p2SourceCount='+SOURCE_COUNT+',__p2SourceWidth='+SOURCE_WIDTH+
      ',__p2DepthCount='+DEPTH_COUNT+',__p2DepthWidth='+DEPTH_WIDTH+
      ',__p2ReaderCount='+READER_COUNT+',__p2ReaderWidth='+READER_WIDTH+
      ',__p2PublisherCount='+PUBLISHER_COUNT+',__p2PublisherWidth='+PUBLISHER_WIDTH+';\n'+source;
    source=rep(source,
      '    stats:new Uint32Array(new SharedArrayBuffer(3*Uint32Array.BYTES_PER_ELEMENT)),',
      '    stats:new Uint32Array(new SharedArrayBuffer(3*Uint32Array.BYTES_PER_ELEMENT)),\n'+
      '    sourceTag:new Uint32Array(new SharedArrayBuffer(capacity*Uint32Array.BYTES_PER_ELEMENT)),\n'+
      '    sourceDepth:new Uint32Array(new SharedArrayBuffer(capacity*Uint32Array.BYTES_PER_ELEMENT)),\n'+
      '    sourceStats:new Uint32Array(new SharedArrayBuffer(__p2SourceCount*__p2SourceWidth*Uint32Array.BYTES_PER_ELEMENT)),\n'+
      '    depthStats:new Uint32Array(new SharedArrayBuffer(__p2DepthCount*__p2DepthWidth*Uint32Array.BYTES_PER_ELEMENT)),\n'+
      '    readerStats:new Uint32Array(new SharedArrayBuffer(__p2ReaderCount*__p2ReaderWidth*Uint32Array.BYTES_PER_ELEMENT)),\n'+
      '    publisherStats:new Uint32Array(new SharedArrayBuffer(__p2PublisherCount*__p2PublisherWidth*Uint32Array.BYTES_PER_ELEMENT)),\n'+
      '    readerPublisherHits:new Uint32Array(new SharedArrayBuffer(__p2ReaderCount*__p2PublisherCount*Uint32Array.BYTES_PER_ELEMENT)),\n'+
      '    probeStats:new Uint32Array(new SharedArrayBuffer(6*Uint32Array.BYTES_PER_ELEMENT)),');
    source=rep(source,
      '  if(!before||(before&1))return 0;',
      '  const __reader=(globalThis.__ISOMAX_SHARED_CENSUS_WORKER??0)>>>0;\n'+
      '  if(__reader<__p2ReaderCount)Atomics.add(cache.readerStats,__reader*__p2ReaderWidth,1);\n'+
      '  Atomics.add(cache.probeStats,0,1);\n'+
      '  if(!before){Atomics.add(cache.probeStats,1,1);return 0;}\n'+
      '  if(before&1){Atomics.add(cache.probeStats,2,1);return 0;}');
    source=rep(source,
      '  for(let w=0;w<cache.keyWords;w+=1)\n    if(Atomics.load(cache.keys,base+w)!==words[offset+w])return 0;',
      '  for(let w=0;w<cache.keyWords;w+=1)\n'+
      '    if(Atomics.load(cache.keys,base+w)!==words[offset+w]){Atomics.add(cache.probeStats,3,1);return 0;}');
    source=rep(source,
      '  if(before!==after||(after&1)||!value)return 0;\n  Atomics.add(cache.stats,0,1);',
      '  if(before!==after||(after&1)||!value){Atomics.add(cache.probeStats,4,1);return 0;}\n'+
      '  Atomics.add(cache.probeStats,5,1);\n'+
      '  const __tag=Atomics.load(cache.sourceTag,slot),__source=__tag&255,__origin=(__tag>>>8)&255,\n'+
      '    __depth=Atomics.load(cache.sourceDepth,slot);\n'+
      '  if(__source<__p2SourceCount){\n'+
      '    Atomics.add(cache.sourceStats,__source*__p2SourceWidth+5,1);\n'+
      '    if(__origin!==__reader)Atomics.add(cache.sourceStats,__source*__p2SourceWidth+6,1);\n'+
      '  }\n'+
      '  if(__depth<__p2DepthCount)Atomics.add(cache.depthStats,__depth*__p2DepthWidth+1,1);\n'+
      '  if(__reader<__p2ReaderCount){\n'+
      '    Atomics.add(cache.readerStats,__reader*__p2ReaderWidth+1,1);\n'+
      '    if(__origin!==__reader)Atomics.add(cache.readerStats,__reader*__p2ReaderWidth+2,1);\n'+
      '  }\n'+
      '  if(__origin<__p2PublisherCount){\n'+
      '    Atomics.add(cache.publisherStats,__origin*__p2PublisherWidth+4,1);\n'+
      '    if(__origin!==__reader)Atomics.add(cache.publisherStats,__origin*__p2PublisherWidth+5,1);\n'+
      '    if(__reader<__p2ReaderCount)Atomics.add(cache.readerPublisherHits,__reader*__p2PublisherCount+__origin,1);\n'+
      '  }\n'+
      '  Atomics.add(cache.stats,0,1);');
    source=rep(source,
      'export function storeConnect4RbaSharedExactCache32(cache,words,offset,value,knownHash){\n  const hash=knownHash===undefined?mixSpan32Locator32(words,offset,cache.keyWords):knownHash,\n    slot=hash&cache.mask,\n    current=Atomics.load(cache.sequence,slot);',
      'export function storeConnect4RbaSharedExactCache32(cache,words,offset,value,knownHash){\n'+
      '  const hash=knownHash===undefined?mixSpan32Locator32(words,offset,cache.keyWords):knownHash,\n'+
      '    slot=hash&cache.mask,\n'+
      '    current=Atomics.load(cache.sequence,slot),\n'+
      '    __source=(globalThis.__ISOMAX_SHARED_CENSUS_SOURCE??0)>>>0,\n'+
      '    __depth=(globalThis.__ISOMAX_SHARED_CENSUS_DEPTH??0)>>>0,\n'+
      '    __origin=(globalThis.__ISOMAX_SHARED_CENSUS_WORKER??0)>>>0;\n'+
      '  if(__source<__p2SourceCount)Atomics.add(cache.sourceStats,__source*__p2SourceWidth,1);\n'+
      '  if(__origin<__p2PublisherCount)Atomics.add(cache.publisherStats,__origin*__p2PublisherWidth,1);\n'+
      '  if(__depth<__p2DepthCount)Atomics.add(cache.depthStats,__depth*__p2DepthWidth+2,1);');
    source=rep(source,
      '  if(current&1){Atomics.add(cache.stats,2,1);return value;}',
      '  if(current&1){\n'+
      '    if(__source<__p2SourceCount)Atomics.add(cache.sourceStats,__source*__p2SourceWidth+2,1);\n'+
      '    if(__origin<__p2PublisherCount)Atomics.add(cache.publisherStats,__origin*__p2PublisherWidth+2,1);\n'+
      '    Atomics.add(cache.stats,2,1);return value;\n'+
      '  }');
    source=rep(source,
      '  if(Atomics.compareExchange(cache.sequence,slot,current,odd)!==current){\n    Atomics.add(cache.stats,2,1);return value;\n  }\n  const base=slot*cache.keyWords;',
      '  if(Atomics.compareExchange(cache.sequence,slot,current,odd)!==current){\n'+
      '    if(__source<__p2SourceCount)Atomics.add(cache.sourceStats,__source*__p2SourceWidth+2,1);\n'+
      '    if(__origin<__p2PublisherCount)Atomics.add(cache.publisherStats,__origin*__p2PublisherWidth+2,1);\n'+
      '    Atomics.add(cache.stats,2,1);return value;\n'+
      '  }\n'+
      '  const __oldTag=Atomics.load(cache.sourceTag,slot),__oldSource=__oldTag&255,__oldOrigin=(__oldTag>>>8)&255;\n'+
      '  if(__origin<__p2PublisherCount){\n'+
      '    Atomics.add(cache.publisherStats,__origin*__p2PublisherWidth+1,1);\n'+
      '    if(current)Atomics.add(cache.publisherStats,__origin*__p2PublisherWidth+3,1);\n'+
      '  }\n'+
      '  if(current&&__oldOrigin<__p2PublisherCount)Atomics.add(cache.publisherStats,__oldOrigin*__p2PublisherWidth+6,1);\n'+
      '  if(__source<__p2SourceCount){\n'+
      '    Atomics.add(cache.sourceStats,__source*__p2SourceWidth+1,1);\n'+
      '    if(current){\n'+
      '      Atomics.add(cache.sourceStats,__source*__p2SourceWidth+3,1);\n'+
      '      if(__oldSource===__source)Atomics.add(cache.sourceStats,__source*__p2SourceWidth+4,1);\n'+
      '      if(__oldSource<__p2SourceCount)Atomics.add(cache.sourceStats,__oldSource*__p2SourceWidth+7,1);\n'+
      '    }\n'+
      '  }\n'+
      '  if(__depth<__p2DepthCount)Atomics.add(cache.depthStats,__depth*__p2DepthWidth,1);\n'+
      '  const base=slot*cache.keyWords;');
    source=rep(source,
      '  Atomics.store(cache.value,slot,value);\n  Atomics.store(cache.sequence,slot,(odd+1)>>>0);',
      '  Atomics.store(cache.value,slot,value);\n'+
      '  Atomics.store(cache.sourceTag,slot,(__source&255)|((__origin&255)<<8));\n'+
      '  Atomics.store(cache.sourceDepth,slot,__depth);\n'+
      '  Atomics.store(cache.sequence,slot,(odd+1)>>>0);');
    return {...result,source};
  }

  if(url.endsWith('/addons/rba-connect4-frontier.mjs')){
    const wrapper='function __p2ProbeExact(cache,words,offset,slot,hash,depth){\n'+
      '  globalThis.__ISOMAX_SHARED_CENSUS_DEPTH=depth;\n'+
      '  return probeConnect4RbaExactCacheSlot32Frontier(cache,words,offset,slot,hash);\n'+
      '}\n'+
      'function __p2StoreExact(cache,words,offset,value,slot,hash,sourceId,depth){\n'+
      '  globalThis.__ISOMAX_SHARED_CENSUS_SOURCE=sourceId;globalThis.__ISOMAX_SHARED_CENSUS_DEPTH=depth;\n'+
      '  return storeConnect4RbaExactCacheSlot32Frontier(cache,words,offset,value,slot,hash);\n'+
      '}\n'+
      'function __p2StoreBound(cache,words,offset,value,slot,hash,depth){\n'+
      '  globalThis.__ISOMAX_SHARED_CENSUS_SOURCE=6;globalThis.__ISOMAX_SHARED_CENSUS_DEPTH=depth;\n'+
      '  return storeConnect4RbaBoundCacheSlot32Frontier(cache,words,offset,value,slot,hash);\n'+
      '}\n\n';
    source=rep(source,'function searchCpcOnlyFrontier(',wrapper+'function searchCpcOnlyFrontier(');
    source=rep(source,
      '    const cached=probeConnect4RbaExactCacheSlot32Frontier(cache,words,keyOffset,cacheSlot,cacheHash);',
      '    const cached=__p2ProbeExact(cache,words,keyOffset,cacheSlot,cacheHash,depth);');
    source=rep(source,
      '      storeConnect4RbaExactCacheSlot32Frontier(cache,words,keyOffset,value,cacheSlot,cacheHash);',
      '      __p2StoreExact(cache,words,keyOffset,value,cacheSlot,cacheHash,1,depth);');
    source=rep(source,
      '      const abs=relativeToAbsFrontier(semanticLo,mover);\n      storeConnect4RbaExactCacheSlot32Frontier(cache,words,keyOffset,abs,cacheSlot,cacheHash);',
      '      const abs=relativeToAbsFrontier(semanticLo,mover);\n      __p2StoreExact(cache,words,keyOffset,abs,cacheSlot,cacheHash,2,depth);');
    source=rep(source,
      '          if(value===0)storeConnect4RbaBoundCacheSlot32Frontier(cache,words,keyOffset,RBA_CACHE_LOWER0,cacheSlot,cacheHash);',
      '          if(value===0)__p2StoreBound(cache,words,keyOffset,RBA_CACHE_LOWER0,cacheSlot,cacheHash,depth);');
    source=rep(source,
      '          storeConnect4RbaExactCacheSlot32Frontier(cache,words,keyOffset,term,cacheSlot,cacheHash);',
      '          __p2StoreExact(cache,words,keyOffset,term,cacheSlot,cacheHash,3,depth);');
    source=rep(source,
      '        if(best===0)storeConnect4RbaBoundCacheSlot32Frontier(cache,words,keyOffset,RBA_CACHE_LOWER0,cacheSlot,cacheHash);',
      '        if(best===0)__p2StoreBound(cache,words,keyOffset,RBA_CACHE_LOWER0,cacheSlot,cacheHash,depth);');
    source=rep(source,
      '        if(best===1)storeConnect4RbaExactCacheSlot32Frontier(cache,words,keyOffset,\n          relativeToAbsFrontier(best,mover),cacheSlot,cacheHash);',
      '        if(best===1)__p2StoreExact(cache,words,keyOffset,\n          relativeToAbsFrontier(best,mover),cacheSlot,cacheHash,4,depth);');
    source=rep(source,
      '      storeConnect4RbaExactCacheSlot32Frontier(cache,words,keyOffset,abs,cacheSlot,cacheHash);\n    }else if(best===0&&alphaOrig>=0)\n      storeConnect4RbaBoundCacheSlot32Frontier(cache,words,keyOffset,RBA_CACHE_UPPER0,cacheSlot,cacheHash);',
      '      __p2StoreExact(cache,words,keyOffset,abs,cacheSlot,cacheHash,5,depth);\n    }else if(best===0&&alphaOrig>=0)\n      __p2StoreBound(cache,words,keyOffset,RBA_CACHE_UPPER0,cacheSlot,cacheHash,depth);');
    return {...result,source};
  }

  if(url.endsWith('/addons/rba-connect4-lazy-smp-worker-frontier.mjs')){
    source=rep(source,
      '  index=workerData.workerIndex,',
      '  index=workerData.workerIndex,\n  __p2Worker=(globalThis.__ISOMAX_SHARED_CENSUS_WORKER=index),');
    return {...result,source};
  }

  if(url.endsWith('/addons/rba-connect4-lazy-smp-host.mjs')){
    source=rep(source,
      '    sharedCacheStoreContention:Atomics.load(sharedExactCache.stats,2),',
      '    sharedCacheStoreContention:Atomics.load(sharedExactCache.stats,2),\n'+
      '    sharedAdmissionCensus:{\n'+
      '      sourceStats:Array.from(sharedExactCache.sourceStats),\n'+
      '      depthStats:Array.from(sharedExactCache.depthStats),\n'+
      '      readerStats:Array.from(sharedExactCache.readerStats),\n'+
      '      publisherStats:Array.from(sharedExactCache.publisherStats),\n'+
      '      readerPublisherHits:Array.from(sharedExactCache.readerPublisherHits),\n'+
      '      probeStats:Array.from(sharedExactCache.probeStats),\n'+
      '    },');
    return {...result,source};
  }

  return result;
}});
