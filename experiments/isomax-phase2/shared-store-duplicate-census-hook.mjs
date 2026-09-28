// Diagnostic-only shared exact duplicate-store census.
// Instrumented timing/cycles/nodes-per-second are invalid.
import {registerHooks} from 'node:module';

function rep(source,from,to,count=1){
  const actual=source.split(from).length-1;
  if(actual!==count)throw new Error('shared duplicate-store census source guard '+actual+'/'+count+' for '+from.slice(0,96));
  return source.replace(from,to);
}

registerHooks({load(url,context,nextLoad){
  const result=nextLoad(url,context);
  const target=url.endsWith('/addons/rba-connect4-shared-exact-cache.mjs')||
    url.endsWith('/addons/rba-connect4-lazy-smp-host.mjs');
  if(!target||result.source===null||result.source===undefined)return result;
  let source=typeof result.source==='string'?result.source:new TextDecoder().decode(result.source);
  source=source.replaceAll('\r\n','\n');

  if(url.endsWith('/addons/rba-connect4-shared-exact-cache.mjs')){
    source=rep(source,
      '    stats:new Uint32Array(new SharedArrayBuffer(3*Uint32Array.BYTES_PER_ELEMENT)),',
      '    stats:new Uint32Array(new SharedArrayBuffer(3*Uint32Array.BYTES_PER_ELEMENT)),\n'+
      '    duplicateStoreStats:new Uint32Array(new SharedArrayBuffer(9*Uint32Array.BYTES_PER_ELEMENT)),\n'+
      '    duplicateStoreMismatch:new Uint32Array(new SharedArrayBuffer(keyWords*Uint32Array.BYTES_PER_ELEMENT)),');
    source=rep(source,
      'export function storeConnect4RbaSharedExactCache32(cache,words,offset,value,knownHash){\n  const hash=knownHash===undefined?mixSpan32Locator32(words,offset,cache.keyWords):knownHash,\n    slot=hash&cache.mask,\n    current=Atomics.load(cache.sequence,slot);',
      'export function storeConnect4RbaSharedExactCache32(cache,words,offset,value,knownHash){\n'+
      '  const hash=knownHash===undefined?mixSpan32Locator32(words,offset,cache.keyWords):knownHash,\n'+
      '    slot=hash&cache.mask,\n'+
      '    current=Atomics.load(cache.sequence,slot);\n'+
      '  Atomics.add(cache.duplicateStoreStats,0,1);\n'+
      '  if(!current)Atomics.add(cache.duplicateStoreStats,1,1);\n'+
      '  else if(current&1)Atomics.add(cache.duplicateStoreStats,2,1);\n'+
      '  else{\n'+
      '    const __base=slot*cache.keyWords,__priorValue=Atomics.load(cache.value,slot);\n'+
      '    let __same=1,__loads=0,__mismatch=-1;\n'+
      '    for(let __w=0;__w<cache.keyWords;__w+=1){\n'+
      '      __loads+=1;\n'+
      '      if(Atomics.load(cache.keys,__base+__w)!==words[offset+__w]){__same=0;__mismatch=__w;break;}\n'+
      '    }\n'+
      '    Atomics.add(cache.duplicateStoreStats,8,__loads);\n'+
      '    const __after=Atomics.load(cache.sequence,slot);\n'+
      '    if(current!==__after||(__after&1)||!__priorValue)Atomics.add(cache.duplicateStoreStats,3,1);\n'+
      '    else if(__same){\n'+
      '      Atomics.add(cache.duplicateStoreStats,4,1);\n'+
      '      if(__priorValue===value)Atomics.add(cache.duplicateStoreStats,5,1);\n'+
      '      else Atomics.add(cache.duplicateStoreStats,6,1);\n'+
      '    }else{\n'+
      '      Atomics.add(cache.duplicateStoreStats,7,1);\n'+
      '      Atomics.add(cache.duplicateStoreMismatch,__mismatch,1);\n'+
      '    }\n'+
      '  }');
    return {...result,source};
  }

  if(url.endsWith('/addons/rba-connect4-lazy-smp-host.mjs')){
    source=rep(source,
      '    sharedCacheStoreContention:Atomics.load(sharedExactCache.stats,2),',
      '    sharedCacheStoreContention:Atomics.load(sharedExactCache.stats,2),\n'+
      '    sharedDuplicateStoreStats:Array.from(sharedExactCache.duplicateStoreStats),\n'+
      '    sharedDuplicateStoreMismatch:Array.from(sharedExactCache.duplicateStoreMismatch),');
    return {...result,source};
  }

  return result;
}});
