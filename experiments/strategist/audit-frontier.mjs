// Diagnostic only. Never use these instrumented runs as timing evidence.
// Compile counters into an in-memory copy of the checked-in worker; do not
// modify the production worker, TT, generated file, or strategist protocol.
import {readFileSync,appendFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../../addons/rba-connect4-ingress.mjs';
import {createConnect4RbaSharedExactCache32} from '../../addons/rba-connect4-shared-exact-cache.mjs';
import {createWorkerBehaviorMemory32,BehaviorWorker,publishWorkerBehavior32} from '../../addons/worker-behavior.mjs';
import {prepareConnect4CpcScratch,evaluateConnect4CpcNonterminal32} from '../../addons/cpc-connect4.mjs';
const [output,mode='fixed']=process.argv.slice(2);
if(!output||existsSync(output))throw Error('new audit output path required');
assert.ok(mode==='fixed'||mode==='narrow');
process.env.JSMINSYS_FLAG_DISPATCH='actions';
const {encodeFrontier}=await import('./controls.mjs');
function once(source,from,to){assert.equal(source.split(from).length,2,from);return source.replace(from,to);}
let frontier=readFileSync(new URL('./frontier.generated.mjs',import.meta.url),'utf8').replaceAll('\r\n','\n');
frontier=once(frontier,'    state.nodes+=1;','    state.nodes+=1;state.auditDepth[depth]+=1;');
frontier=once(frontier,'    state.frontierLimit=state.frontierStride?Math.min',
  '    recordAudit(state,0);\n    state.frontierLimit=state.frontierStride?Math.min');
frontier=once(frontier,'function frontierResult(state,cancel,value,move){',
  'function frontierResult(state,cancel,value,move){\n  recordAudit(state,cancel?2:1);');
frontier=once(frontier,'        values[ai]=value;',
  '        state.auditActions.push({column:caller,value,pass:state.frontierPasses,nodes:state.nodes});\n        values[ai]=value;');
frontier=once(frontier,'          if(value===-4){unfinished=1;continue;}',
  '          if(value===-4){state.auditActions.push({column:caller,value:4,pass:state.frontierPasses,nodes:state.nodes});unfinished=1;continue;}');
frontier+=`
export const auditRecords=[];
function recordAudit(state,kind){
  auditRecords.push({kind,pass:state.frontierPasses,limit:state.frontierLimit,
    nodes:state.nodes,cofactors:state.cofactors,cacheHits:state.cacheHits,
    cpcExact:state.cpcExact,cpcBounds:state.cpcBounds,cutoffs:state.cutoffs,
    horizonStops:state.horizonStops,rootValues:[...state.frontierValues],
    depth:[...state.auditDepth]});
}
`;
let baseline=readFileSync(new URL('../../addons/rba-connect4-alphabeta-behavior.mjs',import.meta.url),'utf8').replaceAll('\r\n','\n');
baseline=once(baseline,'    state.nodes+=1;','    state.nodes+=1;state.auditDepth[depth]+=1;');
baseline=once(baseline,'    if(value>best){best=value;bestMove=caller;}',
  '    state.auditActions.push({column:caller,value,nodes:state.nodes});\n    if(value>best){best=value;bestMove=caller;}');
async function load(source,url){
  source=source.replace(/from '(\.[^']+)'/g,(_,path)=>`from '${new URL(path,url).href}'`);
  return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
const modules={frontier:await load(frontier,new URL('./frontier.generated.mjs',import.meta.url)),
  baseline:await load(baseline,new URL('../../addons/rba-connect4-alphabeta-behavior.mjs',import.meta.url))};
const g=prepareConnect4RbaGeometry({columns:7,rows:6});
const budget=800000;
appendFileSync(output,JSON.stringify({type:'metadata',sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  node:process.version,budget,mode,diagnostic:true,timed:false,
  note:'Per-depth counters and per-node budget reader distort cycles; compare work only. Fresh exact caches per run.'})+'\n');
for(const movesText of ['2053635233350500','1320461024522311']){
  const root=connect4RbaFromMoves([...movesText].map(Number),{geometry:g}),cpc=prepareConnect4CpcScratch(g);
  const rootCpc=evaluateConnect4CpcNonterminal32(g,root.words,0,root.basis,0,root.basis.length,cpc);
  for(const stride of [-1,0,2,4,8]){
    const mod=stride===-1?modules.baseline:modules.frontier;
    const memory=createWorkerBehaviorMemory32(1),words=new Uint32Array(memory.buffer);
    if(stride>=0)publishWorkerBehavior32(words,0,encodeFrontier({stride:stride||4,release:stride===0,
      target:mode==='narrow'&&stride>0?1:0}));
    const shared=createConnect4RbaSharedExactCache32({capacity:16384,keyWords:g.keyWords});
    const state=mod.prepareConnect4RbaAlphaBetaBehavior({geometry:g,cacheCapacity:4096,
      sharedExactCache:shared,behavior:new BehaviorWorker(0,words,0,memory)});
    state.auditDepth=new Uint32Array(g.cellCount+1);
    state.auditActions=[];
    const originalLoad=state.behaviorLoad;
    state.behaviorLoad=()=>state.nodes>=budget?1:originalLoad();
    if(mod.auditRecords)mod.auditRecords.length=0;
    const result=mod.solveConnect4RbaAlphaBetaBehavior(root,{state,reflected:root.reflected});
    const record={type:'audit',root:movesText,stride,rootCpc,rootInterval:[...cpc.interval],
      result,sharedStats:[...shared.stats],depth:[...state.auditDepth],rootActions:state.auditActions,passes:mod.auditRecords??[]};
    appendFileSync(output,JSON.stringify(record)+'\n');
    console.log(movesText,stride,result.status,result.metrics.nodes,result.metrics.horizonStops??0,
      mod.auditRecords?.map(p=>[p.pass,p.limit,p.nodes,p.horizonStops,p.rootValues])??[]);
  }
}
