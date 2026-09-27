// Diagnostic only: same native host/worker/search for 1/2/3/4 workers.
// No production API change. Cold timestamps; optional cold wiring ablations.
import '../cpc-factorial/isomax-node-counts.mjs';
import {registerHooks} from 'node:module';
function replace(s,a,b){if(s.split(a).length!==2)throw Error('scaling source guard: '+a);return s.replace(a,b);}
registerHooks({load(url,context,nextLoad){
  const r=nextLoad(url,context);
  if(!/\/addons\/rba-connect4-lazy-smp-(host|worker)\.mjs$/.test(url))return r;
  let s=(typeof r.source==='string'?r.source:new TextDecoder().decode(r.source)).replaceAll('\r\n','\n');
  if(url.endsWith('-host.mjs')){
    s=replace(s,'workers<2','workers<1');
    s=replace(s,'    metrics=new Float64Array(metricBuffer),','    metrics=new Float64Array(metricBuffer),\n    timingBuffer=new SharedArrayBuffer(workers*64),');
    s=replace(s,'          metricBuffer,','          metricBuffer,\n          timingBuffer,');
    s=replace(s,'    winnerMetrics,\n','    winnerMetrics,\n    workerTiming:Array.from({length:workers},(_,i)=>Array.from(new Float64Array(timingBuffer,i*64,2))),\n');
  }else{
    s=replace(s,'  state=prepareConnect4RbaAlphaBeta({','  timing=new Float64Array(workerData.timingBuffer,index*64,2),\n  state=prepareConnect4RbaAlphaBeta({');
    s=replace(s,'  result=solveConnect4RbaAlphaBeta(','  started=(timing[0]=performance.now()),\n  result=solveConnect4RbaAlphaBeta(');
    s=replace(s,'  m=result.metrics;','  m=result.metrics;\ntiming[1]=performance.now();');
    if(process.env.SCALE_NO_SHARE==='1')s=replace(s,'sharedExactCache:workerData.sharedExactCache','sharedExactCache:null');
    if(process.env.SCALE_ORDER!==undefined)s=replace(s,'orderOffset:index%workerData.geometry.columns',`orderOffset:${Number(process.env.SCALE_ORDER)}`);
  }
  return {...r,source:s};
}});
