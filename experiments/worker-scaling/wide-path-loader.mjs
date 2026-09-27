// Diagnostic only. Same host, memory, move order, flags and endpoint rules.
import './loader.mjs';
import {registerHooks} from 'node:module';
import {readFileSync} from 'node:fs';
const arm=process.env.ISOMAX_WIDE_PATH;
if(!['native','poll','mode','deep-ablation'].includes(arm))throw Error('wide-path arm');
const text=r=>(typeof r.source==='string'?r.source:new TextDecoder().decode(r.source)).replaceAll('\r\n','\n');
const replace=(s,a,b,n=1)=>{if(s.split(a).length!==n+1)throw Error('wide-path seam: '+a);return s.replaceAll(a,b);};
registerHooks({load(url,context,nextLoad){
  const r=nextLoad(url,context);if(arm==='native')return r;
  let s;
  if(url.endsWith('/addons/rba-connect4-lazy-smp-host.mjs')){
    s=text(r);
    s="import {createWorkerBehaviorMemory32} from './worker-behavior.mjs';\n"+s;
    s=replace(s,'    timingBuffer=new SharedArrayBuffer(workers*64),','    timingBuffer=new SharedArrayBuffer(workers*64),\n    widePathMemory=createWorkerBehaviorMemory32(workers),');
    s=replace(s,'          timingBuffer,','          timingBuffer,\n          widePathMemory,');
  }else if(url.endsWith('/addons/rba-connect4-lazy-smp-worker.mjs')){
    s=text(r);
    s=replace(s,"} from './rba-connect4-alphabeta.mjs';",` } from '${arm==='poll'?'./rba-connect4-alphabeta-behavior.mjs':'../experiments/strategist/modes.generated.mjs'}';\nimport {BehaviorWorker} from './worker-behavior.mjs';`);
    s=replace(s,'  prepareConnect4RbaAlphaBeta,','  prepareConnect4RbaAlphaBetaBehavior as prepareConnect4RbaAlphaBeta,');
    s=replace(s,'  solveConnect4RbaAlphaBeta,','  solveConnect4RbaAlphaBetaBehavior as solveConnect4RbaAlphaBeta,');
    s=replace(s,'  RBA_AB_CPC_ONLY,','  RBA_AB_CPC_ONLY_BEHAVIOR as RBA_AB_CPC_ONLY,');
    s=replace(s,'    geometry:workerData.geometry,','    geometry:workerData.geometry,\n    behavior:new BehaviorWorker(index,new Uint32Array(workerData.widePathMemory.buffer),index,workerData.widePathMemory),');
    s=replace(s,'timing[1]=performance.now();','timing[1]=performance.now();\nif(result.status!==\'EXACT\')throw Error(\'wide-path returned incomplete result\');');
    // Mode-only metrics have no four-front fields. Adapt at cold publication.
    for(const name of ['frontCalls','frontExact','frontFailures','frontSteps','frontActionExact'])s=replace(s,`=m.${name};`,`=m.${name}??0;`);
  }else if(url.endsWith('/addons/rba-connect4-alphabeta-behavior.mjs')||url.endsWith('/experiments/strategist/modes.generated.mjs')){
    s=text(r);
    if(arm==='deep-ablation'&&url.endsWith('/modes.generated.mjs')){
      const ordinary=readFileSync(new URL('../../addons/rba-connect4-alphabeta-behavior.mjs',import.meta.url),'utf8').replaceAll('\r\n','\n');
      const start=ordinary.indexOf('function searchCpcOnlyBehavior('),end=ordinary.indexOf('function searchBehavior(',start);
      if(start<0||end<0)throw Error('deep body seam');
      const a=s.indexOf('function searchCpcOnlyBehavior('),b=s.indexOf('export function solveConnect4RbaAlphaBetaBehavior',a);
      if(a<0||b<0)throw Error('mode body seam');
      s=s.slice(0,a)+ordinary.slice(start,end)+s.slice(b);
      // Same mode preparation, completion reader and root window as MODE.
      // No shallow request is sent. This ablation is NOT live-switch capable.
    }
    s=replace(s,'nodes:0,cutoffs:0','benchmarkNodes:null,nodes:0,cutoffs:0');
    const count=url.endsWith('/addons/rba-connect4-alphabeta-behavior.mjs')?2:1;
    s=replace(s,'state.nodes+=1;','state.benchmarkNodes[0]+=1;',count);
    s=replace(s,'state.nodes=state.cutoffs=','state.benchmarkNodes[0]=state.cutoffs=');
    s=replace(s,'nodes:s.nodes,','nodes:s.benchmarkNodes[0],');
  }else return r;
  return {...r,source:s};
}});
