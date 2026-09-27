import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {writeFileSync} from 'node:fs';
const dirs=process.argv.slice(2,4),output=process.argv[4],modules=[];
for(const dir of dirs){const load=p=>import(pathToFileURL(dir+'/addons/'+p));modules.push({geometry:await load('rba-connect4-geometry.mjs'),ingress:await load('rba-connect4-ingress.mjs'),solver:await load('rba-connect4-frontier.mjs'),flags:await load('worker-root-frontier.mjs'),behavior:await load('worker-behavior.mjs')});}
const results=[];
for(const [columns,rows,sequences] of [[4,4,['0011','01230123','010122']],[7,6,['1320461024522311','2053635233350500']]]){
 for(const seq of sequences)for(const mirror of [false,true])for(const mode of ['wide','deep','release','stop']){
  const pair=[];
  for(const m of modules){
   const g=m.geometry.prepareConnect4RbaGeometry({columns,rows}),moves=[...seq].map(c=>mirror?columns-1-Number(c):Number(c)),root=m.ingress.connect4RbaFromMoves(moves,{geometry:g});
   const memory=m.behavior.createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer);
   m.behavior.publishWorkerBehavior32(words,0,m.flags.encodeRootFrontier32({release:mode==='deep'}));
   const state=m.solver.prepareConnect4RbaFrontier({geometry:g,cacheCapacity:65536,behavior:new m.behavior.BehaviorWorker(0,words,0,memory)}),load=state.behaviorLoad;let reads=0;
   state.behaviorLoad=()=>{reads++;if(reads===30&&mode==='release')m.behavior.publishWorkerBehavior32(words,0,m.flags.encodeRootFrontier32({release:true}));if(reads===30&&mode==='stop')m.behavior.publishWorkerBehavior32(words,0,1);return load();};
   pair.push({...m.solver.solveConnect4RbaFrontier(root,{state,reflected:root.reflected}),reads});
  }
  assert.deepEqual(pair[1],pair[0],JSON.stringify({columns,rows,seq,mirror,mode}));
  results.push({columns,rows,seq,mirror,mode,...pair[1]});
 }
}
writeFileSync(output,JSON.stringify({comparisons:results.length,pass:true,results},null,2)+'\n');console.log(results.length+' full result/metric/read-count comparisons PASS');
