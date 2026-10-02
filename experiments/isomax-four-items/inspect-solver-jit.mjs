// Diagnostic only: trace compiler inlining on actual recursive solver calls.
// Small-cache fixtures are not performance evidence for the 5 GiB benchmark.
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {prepareConnect4RbaGeometry} from '../../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../../addons/rba-connect4-ingress.mjs';
import {BehaviorWorker,createWorkerBehaviorMemory32,publishWorkerBehavior32} from '../../addons/worker-behavior.mjs';
import {encodeRootFrontier32} from '../../addons/worker-root-frontier.mjs';
const library=resolve(process.argv[2]);
const load=name=>import(pathToFileURL(resolve(library,'experiments/isomax-lean/'+name+'.mjs')).href);
const solver=await load('solver'),tt=await load('shared-cache');
const g=prepareConnect4RbaGeometry({columns:7,rows:6});
let checksum=0;
for(let repeat=0;repeat<4;repeat++)for(const sequence of ['1320461024522311','2053635233350500']){
  const memory=createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer);
  publishWorkerBehavior32(words,0,encodeRootFrontier32({release:true}));
  const cache=tt.createConnect4RbaSharedExactCache32({capacity:4096,keyWords:14,geometry:g});
  const state=solver.prepareConnect4RbaFrontier({geometry:g,cacheCapacity:4096,sharedExactCache:cache,
    orderOffset:repeat,behavior:new BehaviorWorker(0,words,0,memory)});
  const root=connect4RbaFromMoves([...sequence].map(Number),{geometry:g});
  const result=solver.solveConnect4RbaFrontier(root,{state,reflected:root.reflected});
  if(result.status!=='EXACT')throw Error(result.status);
  checksum+=result.value*7+result.move;
}
console.log(JSON.stringify({kind:'actual solver JIT inspection; not a timed benchmark',library,checksum,
  node:process.version,v8:process.versions.v8}));
