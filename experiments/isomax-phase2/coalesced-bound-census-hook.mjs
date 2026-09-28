// Diagnostic-only Phase-2 coalesced zero-bound census.
// Instrumented timing/cycles are invalid.
import {registerHooks} from 'node:module';

globalThis.__ISOMAX_BOUND_COALESCE_CENSUS??=new Float64Array(7);
const C=globalThis.__ISOMAX_BOUND_COALESCE_CENSUS;

function rep(source,from,to,count=1){
  const actual=source.split(from).length-1;
  if(actual!==count)throw new Error('coalesce census source guard '+actual+'/'+count+' for '+from.slice(0,80));
  return source.replace(from,to);
}

registerHooks({load(url,context,nextLoad){
  const result=nextLoad(url,context);
  let source=typeof result.source==='string'?result.source:new TextDecoder().decode(result.source);
  source=source.replaceAll('\r\n','\n');

  if(url.endsWith('/addons/rba-connect4-frontier.mjs')){
    source='const __p2BoundCensus=globalThis.__ISOMAX_BOUND_COALESCE_CENSUS;\n'+source;
    source=rep(source,
      'function storeConnect4RbaBoundCacheSlot32Frontier(cache,words,offset,value,slot,hash){',
      'function storeConnect4RbaBoundCacheSlot32Frontier(cache,words,offset,value,slot,hash){\n  __p2BoundCensus[0]+=1;');
    source=rep(source,
      '    if(prior&&prior<=3)return 0;',
      '    if(prior&&prior<=3){__p2BoundCensus[3]+=1;return 0;}');
    source=rep(source,
      '        if(prior===value)return prior;',
      '        if(prior===value){__p2BoundCensus[1]+=1;return prior;}');
    source=rep(source,
      '        // Same q has both >=0 and <=0, therefore exact draw.',
      '        __p2BoundCensus[2]+=1;\n        // Same q has both >=0 and <=0, therefore exact draw.');
    source=rep(source,
      '        if(beta<=0){state.cutoffs+=1;return completeBehaviorNode32(state, 0);}',
      '        if(beta<=0){__p2BoundCensus[4]+=1;state.cutoffs+=1;return completeBehaviorNode32(state, 0);}');
    source=rep(source,
      '        if(alpha<0)alpha=0;',
      '        if(alpha<0){__p2BoundCensus[5]+=1;alpha=0;}else __p2BoundCensus[6]+=1;');
    source=rep(source,
      '        if(alpha>=0){state.cutoffs+=1;return completeBehaviorNode32(state, 0);}',
      '        if(alpha>=0){__p2BoundCensus[4]+=1;state.cutoffs+=1;return completeBehaviorNode32(state, 0);}');
    source=rep(source,
      '        if(beta>0)beta=0;',
      '        if(beta>0){__p2BoundCensus[5]+=1;beta=0;}else __p2BoundCensus[6]+=1;');
    return {...result,source};
  }

  if(url.endsWith('/addons/rba-connect4-lazy-smp-worker-frontier.mjs')){
    source=rep(source,'RESULT_STRIDE=4,METRIC_WIDTH=15,','RESULT_STRIDE=4,METRIC_WIDTH=22,');
    source=rep(source,
      'metrics[metricBase+14]=m.cofactors;',
      'metrics[metricBase+14]=m.cofactors;\nfor(let i=0;i<7;i+=1)metrics[metricBase+15+i]=C[i];');
    return {...result,source};
  }

  if(url.endsWith('/addons/rba-connect4-lazy-smp-host.mjs')){
    source=rep(source,'CONTROL_WORDS=5,RESULT_STRIDE=4,METRIC_WIDTH=15,','CONTROL_WORDS=5,RESULT_STRIDE=4,METRIC_WIDTH=22,');
    source=rep(source,
      '    winnerMetrics,\n    nodeCounts:rootFrontier?',
      '    winnerMetrics,\n    boundCensus:Array.from({length:workers},(_,i)=>Array.from(metrics.slice(i*METRIC_WIDTH+15,i*METRIC_WIDTH+22))),\n    nodeCounts:rootFrontier?');
    return {...result,source};
  }

  return result;
}});
