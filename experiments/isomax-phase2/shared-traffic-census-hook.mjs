// Diagnostic-only shared exact traffic census for the pure coalesced Phase-2 candidate.
// Instrumentation changes execution cost/interleaving. Timing/cycles are invalid.
// Counters live in one disjoint shared-memory slice per worker so cancellation/
// host termination cannot erase non-winning-worker observations.
import {registerHooks} from 'node:module';

const RANKS=43,CHANNELS=8,WIDTH=RANKS*CHANNELS;

function rep(source,from,to,count=1){
  const actual=source.split(from).length-1;
  if(actual!==count)throw new Error('shared traffic census source guard '+actual+'/'+count+' for '+from.slice(0,100));
  return source.replace(from,to);
}

registerHooks({load(url,context,nextLoad){
  const result=nextLoad(url,context);
  const target=url.endsWith('/addons/rba-connect4-frontier.mjs')||
    url.endsWith('/addons/rba-connect4-lazy-smp-host.mjs');
  if(!target)return result;
  if(result.source===null||result.source===undefined)return result;
  let source=typeof result.source==='string'?result.source:new TextDecoder().decode(result.source);
  source=source.replaceAll('\r\n','\n');

  if(url.endsWith('/addons/rba-connect4-frontier.mjs')){
    source=`import {workerData as __p2WorkerData} from 'node:worker_threads';
const __p2TrafficRanks=43,__p2TrafficWidth=344;
const __p2SharedTraffic=__p2WorkerData?.sharedTrafficBuffer
  ?new Uint32Array(__p2WorkerData.sharedTrafficBuffer,__p2WorkerData.workerIndex*__p2TrafficWidth*Uint32Array.BYTES_PER_ELEMENT,__p2TrafficWidth)
  :new Uint32Array(__p2TrafficWidth);
`+source;

    source=rep(source,
      '  cache.shared=sharedExactCache;cache.sharedSampleBits=(sharedSampleMask<<24)>>>0;',
      '  cache.shared=sharedExactCache;cache.sharedSampleBits=(sharedSampleMask<<24)>>>0;cache.__p2MetaOffset=g.metaOffset;');

    source=rep(source,
      '  return cache.shared&&!(hash&cache.sharedSampleBits)?probeConnect4RbaSharedExactCache32(cache.shared,words,offset,hash):0;',
      `  if(cache.shared&&!(hash&cache.sharedSampleBits)){
    const rank=words[offset+cache.__p2MetaOffset]>>>2;
    __p2SharedTraffic[rank]+=1;
    const shared=probeConnect4RbaSharedExactCache32(cache.shared,words,offset,hash);
    if(shared>=1&&shared<=3)__p2SharedTraffic[shared*__p2TrafficRanks+rank]+=1;
    return shared;
  }
  return 0;`);

    source=rep(source,
      '  if(cache.shared&&!(hash&cache.sharedSampleBits))storeConnect4RbaSharedExactCache32(cache.shared,words,offset,value,hash);',
      `  if(cache.shared&&!(hash&cache.sharedSampleBits)){
    const rank=words[offset+cache.__p2MetaOffset]>>>2;
    if(value>=1&&value<=3)__p2SharedTraffic[(3+value)*__p2TrafficRanks+rank]+=1;
    storeConnect4RbaSharedExactCache32(cache.shared,words,offset,value,hash);
  }`);

    source=rep(source,
      '        if(cache.shared&&!(hash&cache.sharedSampleBits))storeConnect4RbaSharedExactCache32(cache.shared,words,offset,2,hash);',
      `        if(cache.shared&&!(hash&cache.sharedSampleBits)){
          const rank=words[offset+cache.__p2MetaOffset]>>>2;
          __p2SharedTraffic[7*__p2TrafficRanks+rank]+=1;
          storeConnect4RbaSharedExactCache32(cache.shared,words,offset,2,hash);
        }`);
    return {...result,source};
  }

  if(url.endsWith('/addons/rba-connect4-lazy-smp-host.mjs')){
    source=rep(source,
      '    metricBuffer=new SharedArrayBuffer(workers*METRIC_WIDTH*Float64Array.BYTES_PER_ELEMENT),\n    metrics=new Float64Array(metricBuffer),',
      '    metricBuffer=new SharedArrayBuffer(workers*METRIC_WIDTH*Float64Array.BYTES_PER_ELEMENT),\n    metrics=new Float64Array(metricBuffer),\n    sharedTrafficBuffer=new SharedArrayBuffer(workers*344*Uint32Array.BYTES_PER_ELEMENT),');
    source=rep(source,
      '          metricBuffer,\n          nodeCounterBuffer,',
      '          metricBuffer,\n          sharedTrafficBuffer,\n          nodeCounterBuffer,');
    source=rep(source,
      '    winnerMetrics,\n    nodeCounts:rootFrontier?',
      '    winnerMetrics,\n    sharedTrafficCensus:Array.from({length:workers},(_,i)=>Array.from(new Uint32Array(sharedTrafficBuffer,i*344*Uint32Array.BYTES_PER_ELEMENT,344))),\n    nodeCounts:rootFrontier?');
    source=rep(source,
      '      control.byteLength+resultWords.byteLength+metricBuffer.byteLength+(behaviorMemory===null?0:behaviorMemory.buffer.byteLength)+',
      '      control.byteLength+resultWords.byteLength+metricBuffer.byteLength+sharedTrafficBuffer.byteLength+(behaviorMemory===null?0:behaviorMemory.buffer.byteLength)+');
    return {...result,source};
  }

  return result;
}});
