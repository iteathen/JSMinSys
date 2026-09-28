// Diagnostic-only shared key-mismatch prefix census.
// Instrumented timing/cycles/nodes-per-second are invalid.
import {registerHooks} from 'node:module';

function rep(source,from,to,count=1){
  const actual=source.split(from).length-1;
  if(actual!==count)throw new Error('shared mismatch-prefix census source guard '+actual+'/'+count+' for '+from.slice(0,96));
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
      '    mismatchPrefix:new Uint32Array(new SharedArrayBuffer((keyWords+2)*Uint32Array.BYTES_PER_ELEMENT)),');
    source=rep(source,
      '  const base=slot*cache.keyWords;\n  for(let w=0;w<cache.keyWords;w+=1)\n    if(Atomics.load(cache.keys,base+w)!==words[offset+w])return 0;',
      '  const base=slot*cache.keyWords;\n'+
      '  for(let w=0;w<cache.keyWords;w+=1){\n'+
      '    Atomics.add(cache.mismatchPrefix,cache.keyWords+1,1);\n'+
      '    if(Atomics.load(cache.keys,base+w)!==words[offset+w]){\n'+
      '      Atomics.add(cache.mismatchPrefix,w,1);return 0;\n'+
      '    }\n'+
      '  }\n'+
      '  Atomics.add(cache.mismatchPrefix,cache.keyWords,1);');
    return {...result,source};
  }

  if(url.endsWith('/addons/rba-connect4-lazy-smp-host.mjs')){
    source=rep(source,
      '    sharedCacheStoreContention:Atomics.load(sharedExactCache.stats,2),',
      '    sharedCacheStoreContention:Atomics.load(sharedExactCache.stats,2),\n'+
      '    sharedMismatchPrefix:Array.from(sharedExactCache.mismatchPrefix),');
    return {...result,source};
  }

  return result;
}});
