// Diagnostic-only shared exact traffic census for the pure coalesced Phase-2 candidate.
// Instrumentation changes execution cost/interleaving. Timing/cycles are invalid.
import {registerHooks} from 'node:module';

const RANKS=43,CHANNELS=8,WIDTH=RANKS*CHANNELS;
globalThis.__ISOMAX_SHARED_TRAFFIC_CENSUS??=new Float64Array(WIDTH);
const C=globalThis.__ISOMAX_SHARED_TRAFFIC_CENSUS;

function rep(source,from,to,count=1){
  const actual=source.split(from).length-1;
  if(actual!==count)throw new Error('shared traffic census source guard '+actual+'/'+count+' for '+from.slice(0,100));
  return source.replace(from,to);
}

registerHooks({load(url,context,nextLoad){
  const result=nextLoad(url,context);
  const target=url.endsWith('/addons/rba-connect4-frontier.mjs')||
    url.endsWith('/addons/rba-connect4-lazy-smp-worker-frontier.mjs')||
    url.endsWith('/addons/rba-connect4-lazy-smp-host.mjs');
  if(!target)return result;
  if(result.source===null||result.source===undefined)return result;
  let source=typeof result.source==='string'?result.source:new TextDecoder().decode(result.source);
  source=source.replaceAll('\r\n','\n');

  if(url.endsWith('/addons/rba-connect4-frontier.mjs')){
    source='const __p2SharedTraffic=globalThis.__ISOMAX_SHARED_TRAFFIC_CENSUS;\nconst __p2TrafficRanks=43;\n'+source;

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

  if(url.endsWith('/addons/rba-connect4-lazy-smp-worker-frontier.mjs')){
    source=rep(source,'RESULT_STRIDE=4,METRIC_WIDTH=15,','RESULT_STRIDE=4,METRIC_WIDTH=359,');
    source=rep(source,
      'metrics[metricBase+14]=m.cofactors;',
      'metrics[metricBase+14]=m.cofactors;\nfor(let i=0;i<344;i+=1)metrics[metricBase+15+i]=globalThis.__ISOMAX_SHARED_TRAFFIC_CENSUS[i];');
    return {...result,source};
  }

  if(url.endsWith('/addons/rba-connect4-lazy-smp-host.mjs')){
    source=rep(source,'CONTROL_WORDS=5,RESULT_STRIDE=4,METRIC_WIDTH=15,','CONTROL_WORDS=5,RESULT_STRIDE=4,METRIC_WIDTH=359,');
    source=rep(source,
      '    winnerMetrics,\n    nodeCounts:rootFrontier?',
      '    winnerMetrics,\n    sharedTrafficCensus:Array.from({length:workers},(_,i)=>Array.from(metrics.slice(i*METRIC_WIDTH+15,i*METRIC_WIDTH+359))),\n    nodeCounts:rootFrontier?');
    return {...result,source};
  }

  return result;
}});
