// Measurement-only loader. Repository/library files remain byte-for-byte unchanged.
// Redirect the EXISTING numeric node counter; do not add an extra counter,
// per-node callback, atomic, logging, or synchronization operation.
// Each worker writes its own 64-byte slot. Final reads occur after worker join.
import {registerHooks} from 'node:module';
function replaceExact(source,from,to,count=1){
  if(source.split(from).length-1!==count)throw Error(`Instrumentation source guard failed: ${from}`);
  return source.replaceAll(from,to);
}
registerHooks({load(url,context,nextLoad){
  const result=nextLoad(url,context);
  if(!url.includes('/addons/'))return result;
  if(!/rba-connect4-(alphabeta|lazy-smp-host|lazy-smp-worker)\.mjs$/.test(url))return result;
  let source=(typeof result.source==='string'?result.source:new TextDecoder().decode(result.source)).replaceAll('\r\n','\n');
  if(url.endsWith('/rba-connect4-alphabeta.mjs')){
    source=replaceExact(source,'nodes:0,cutoffs:0','benchmarkNodes:null,nodes:0,cutoffs:0');
    source=replaceExact(source,'state.nodes+=1;','state.benchmarkNodes[0]+=1;',2);
    source=replaceExact(source,'state.nodes=state.cutoffs=','state.benchmarkNodes[0]=state.cutoffs=');
    source=replaceExact(source,'nodes:s.nodes,','nodes:s.benchmarkNodes[0],');
  }else if(url.endsWith('/rba-connect4-lazy-smp-worker.mjs')){
    source=replaceExact(source,'  result=solveConnect4RbaAlphaBeta(',
      '  benchmarkCounter=(state.benchmarkNodes=new Float64Array(workerData.nodeCounterBuffer,index*64,1)),\n  result=solveConnect4RbaAlphaBeta(');
  }else{
    source=replaceExact(source,'    metrics=new Float64Array(metricBuffer),',
      '    metrics=new Float64Array(metricBuffer),\n    nodeCounterBuffer=new SharedArrayBuffer(workers*64),');
    source=replaceExact(source,'          metricBuffer,','          metricBuffer,\n          nodeCounterBuffer,');
    source=replaceExact(source,'    winnerMetrics,\n    sharedCacheHits:',
      '    winnerMetrics,\n    benchmarkNodeCounts:Array.from({length:workers},(_,i)=>new Float64Array(nodeCounterBuffer,i*64,1)[0]),\n    nodeCounterBytes:nodeCounterBuffer.byteLength,\n    sharedCacheHits:');
  }
  return {...result,source};
}});
