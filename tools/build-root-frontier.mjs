import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

// Build-time specialization of the native CPC-only solver. No runtime loaders.
// This owns the selected full-window iterative root algorithm; ordinary search
// remains the source of recursive semantics. Fail closed on changed seams.
const base=readFileSync(new URL('../addons/rba-connect4-alphabeta-behavior.mjs',import.meta.url),'utf8').replaceAll('\r\n','\n');
function replaceOnce(source,from,to){assert.equal(source.split(from).length,2,from);return source.replace(from,to);}
let source=base.slice(0,base.indexOf('function frontEvidenceBehavior'));
source=replaceOnce(source,"import {prepareConnect4RbaFrontArena,buildConnect4RbaFourFront,queryConnect4RbaFourFront} from './rba-connect4-front.mjs';\n",'');
source=replaceOnce(source,'  const g=geometry,profile=',`  if(mode!==RBA_AB_CPC_ONLY_BEHAVIOR)throw RangeError('PFIF requires CPC-only');

  const g=geometry,profile=`);
source=replaceOnce(source,`    front:mode===RBA_AB_CPC_FOUR_FRONT_BEHAVIOR
      ?prepareConnect4RbaFrontArena(g,{depth:boundaryDepth,capacity:boundaryCapacity,budget:boundaryBudget,profile})
      :null,`,`    front:null,frontierValues:new Int8Array(g.columns),frontierPasses:0,horizonStops:0,
    frontierPending:0,frontierAutoReleases:0,`);
let search=base.slice(base.indexOf('function searchCpcOnlyBehavior'),base.indexOf('function searchBehavior('));
search=replaceOnce(search,'    const forced=state.cpc.forcedColumn[0],',`    // HOT: one scalar horizon comparison after exact proofs/bounds. Numeric 4
    // is unfinished, never WDL and never sign-flipped through a forced chain.
    // Keep this guard and its parent propagation together. Do not remove.
    if(depth>=state.frontierLimit){state.horizonStops+=1;return completeBehaviorNode32(state,4);}
    const forced=state.cpc.forcedColumn[0],`);
search=replaceOnce(search,'    let best=-2;','    let best=-2,unfinished=0;');
search=replaceOnce(search,'        if (value === -3) return 3;',`        if (value === -3) return 3;
        if(value===-4){unfinished=1;continue;}`);
search=replaceOnce(search,'    if(best===-2)return completeBehaviorNode32(state, 0);',`    // A witnessed cutoff remains valid even with unfinished siblings; absence
    // of such a cutoff cannot be promoted to an exact value or a cache entry.
    if(unfinished)return completeBehaviorNode32(state,4);
    if(best===-2)return completeBehaviorNode32(state, 0);`);
// HOT numeric contract: WDL/bounds/sentinels fit signed int32. Normalize polarity
// transport so draw zero never becomes IEEE -0 and forces floating-point/deopt
// handling. No extra callback, branch or changed search/flag cadence. Preserve.
const polaritySites=[['sign*absToRelativeBehavior(cached,mover)',1],
  ['sign*absToRelativeBehavior(value,mover)',1],['sign*semanticLo',2],
  ['sign*semanticHi',1],['sign*value',2],['sign*best',2]];
for(const [expression,count] of polaritySites){
  assert.equal(search.split(expression).length,count+1,expression);
  search=search.replaceAll(expression,`((${expression})|0)`);
}
search=replaceOnce(search,'  let sign=1;',`  // HOT: signed integer polarity transport; zero is DRAW, never IEEE -0.
  // Preserve |0 at sign/negation boundaries; all values and sentinels fit int32.
  let sign=1;`);
search=replaceOnce(search,'const nextAlpha=-beta,nextBeta=-alpha;',
  'const nextAlpha=(-beta)|0,nextBeta=(-alpha)|0;');
search=replaceOnce(search,'childLiveOffset,childOrderRow,-beta,-alpha);',
  'childLiveOffset,childOrderRow,(-beta)|0,(-alpha)|0)|0;');
source+=search;
let root=base.slice(base.indexOf('export function solveConnect4RbaAlphaBetaBehavior'),base.indexOf('  const childKey=g.keyWords,childBasis=g.maxBasis;'));
root=replaceOnce(root,'  resetConnect4RbaExactCache32Behavior(state.cache);',`  resetConnect4RbaExactCache32Behavior(state.cache);
  state.frontierValues.fill(-2);state.frontierPasses=state.horizonStops=state.frontierAutoReleases=state.frontierPending=0;`);
const frontStart=root.indexOf('  if(state.mode===RBA_AB_CPC_FOUR_FRONT_BEHAVIOR){');
const frontEnd=root.indexOf('  const rootExact=',frontStart);
assert.ok(frontStart>0&&frontEnd>frontStart);root=root.slice(0,frontStart)+root.slice(frontEnd);
root=replaceOnce(root,`  const rootExact=rootLo===rootHi?absToRelativeBehavior(rootLo,mover):null,
    rootSemanticLo=mover===0?rootLo-2:2-rootHi,
    rootSemanticHi=mover===0?rootHi-2:2-rootLo;`,
  '  const rootExact=rootLo===rootHi?absToRelativeBehavior(rootLo,mover):null;');
const windowStart=root.indexOf('  // A two-value exact CPC interval');
const windowEnd=root.indexOf('  const forced=',windowStart);
assert.ok(windowStart>0&&windowEnd>windowStart);root=root.slice(0,windowStart)+root.slice(windowEnd);
source+=root+`
  // HOT PFIF action loop: all storage prepared before search; root RBA and live
  // state initialized once above. No ingress replay/cache reset between passes.
  // Full-window child results are exact; sentinel 4 retains the obligation.
  // This first candidate deliberately pays for full-window root probes. Count
  // that cost and every repeated pass; do not imply equivalence to baseline AB.
  if(completeBehaviorNode32(state,0)===3)return frontierResult(state,3,0,-1);
  state.frontierLimit=state.frontierStride||g.cellCount;
  state.frontierPending=actionCount;
  releaseNarrowFrontier(state);
  const childKey=g.keyWords,childBasis=g.maxBasis,values=state.frontierValues;
  while(true){
    state.frontierPasses+=1;
    let best=-2,bestMove=-1,unfinished=0;
    for(let ai=0;ai<actionCount;ai++){
      const caller=ordered[ai],column=reflected?g.mirrorColumn[caller]:caller;
      if(rootExact===-1)return frontierResult(state,0,relativeToAbsBehavior(-1,mover),caller);
      let value=values[ai];
      if(value===-2){
        const height=state.words[column],term=connect4RbaCofactorKnownHeight(
          g,state.profile,state.words,0,state.basis,0,state.basisSize[0],column,height,
          state.words,childKey,state.basis,childBasis,state.coord.seen,state.basisSize,1,state.coord.map,state.coord.inverse);
        state.cofactors+=1;
        if(term){value=absToRelativeBehavior(term,mover);if(completeBehaviorNode32(state,0)===3)return frontierResult(state,3,0,-1);}
        else{
          const childN=state.basisSize[1],childReflected=connect4RbaCanonicalize(
            g,state.profile,state.words,childKey,state.basis,childBasis,childN,state.coord);
          advanceConnect4LiveLineState32(live,state.liveState,0,mover,height*g.columns+caller,state.liveState,live.stateWords);
          value=-searchCpcOnlyBehavior(state,1,childKey,childBasis,childN,mover^1,(reflected?1:0)^childReflected,
            live.stateWords,g.columns,-2,2)|0;
          if(value===-3)return frontierResult(state,3,0,-1);
          if(value===-4){unfinished=1;continue;}
        }
        values[ai]=value;
        state.frontierPending-=1;
        releaseNarrowFrontier(state);
      }
      if(value>best){best=value;bestMove=caller;}
      // Earlier unresolved actions may tie this witness. Keep deterministic
      // root action interpretation; never retire them using a heuristic rank.
      if(!unfinished&&(best===1||best===rootExact))return frontierResult(state,0,relativeToAbsBehavior(best,mover),bestMove);
    }
    if(!unfinished)return frontierResult(state,0,relativeToAbsBehavior(best,mover),bestMove);
    state.frontierLimit=state.frontierStride?Math.min(g.cellCount,state.frontierLimit+state.frontierStride):g.cellCount;
  }
}
// Root-boundary action only; never called at an ordinary recursive node.
// Release as soon as the flag's narrowing target is met, not after another
// broad pass. This counts unresolved ROOT actions, not all frontier leaves.
// Keep exact values/cache and current frames. No copy, queue or TT mutation.
function releaseNarrowFrontier(state){
  if(state.frontierTarget&&state.frontierPending<=state.frontierTarget&&state.frontierStride){
    state.frontierLimit=state.g.cellCount;state.frontierStride=0;state.frontierAutoReleases+=1;
  }
}
// Cold operation boundary only: string status and result allocation never run
// at a recursive node or between frontier passes. Do not move them there.
function frontierResult(state,cancel,value,move){
  if(!cancel&&completeBehaviorNode32(state,0)===3){cancel=3;move=-1;}
  const mover=(state.words[state.g.metaOffset]>>>2)&1;
  return {status:cancel?'CANCELLED':'EXACT',value:cancel?null:value,
    relative:cancel?null:absToRelativeBehavior(value,mover),move,metrics:metricsBehavior(state)};
}
`;
let metrics=base.slice(base.indexOf('function metricsBehavior(s)'));
metrics=replaceOnce(metrics,'return {nodes:s.nodes,','return {frontierPending:s.frontierPending,frontierAutoReleases:s.frontierAutoReleases,frontierPasses:s.frontierPasses,horizonStops:s.horizonStops,frontierLimit:s.frontierLimit,nodes:s.nodes,');
source+=metrics;

source=source.replace("import {prepareSearchBehavior32,completeBehaviorNode32} from './worker-behavior-search.mjs';",
  "import {prepareRootFrontierBehavior32 as prepareSearchBehavior32,completeRootFrontierNode32 as completeBehaviorNode32} from './worker-root-frontier.mjs';");
source=source.replaceAll('Behavior','Frontier');
// Restore imported local aliases after renaming only the solver-owned functions.
source=source.replaceAll('prepareSearchFrontier32','prepareSearchBehavior32').replaceAll('completeFrontierNode32','completeBehaviorNode32');
source=source.replace('prepareRootFrontierFrontier32','prepareRootFrontierBehavior32');
source=source.replaceAll('prepareConnect4RbaAlphaBetaFrontier','prepareConnect4RbaFrontier').replaceAll('solveConnect4RbaAlphaBetaFrontier','solveConnect4RbaFrontier');
source=source.replaceAll('RBA_AB_CPC_ONLY_BEHAVIOR','RBA_FRONTIER_CPC_ONLY').replaceAll('RBA_AB_CPC_FOUR_FRONT_BEHAVIOR','RBA_FRONTIER_UNUSED');
source=source.replace('export const RBA_FRONTIER_UNUSED=1;','');
source=source.replace(/  boundaryDepth=2,\n  boundaryCapacity=256,\n  boundaryBudget=100000,\n/,'');
source=source.replace("  if(mode!==RBA_FRONTIER_CPC_ONLY&&mode!==RBA_FRONTIER_UNUSED)throw new RangeError('invalid alpha-beta mode');\n",'');
source=source.replace(/    actionLo:.*\n    actionHi:.*\n    actionKnown:.*\n/,'');
source=source.replace('    front:null,frontierValues:','    frontierValues:');
source=source.replace('  behavior,','  behavior,\n  nodeCounts=new Float64Array(1),');
source=source.replace("  const g=geometry,profile=", "  if(!(nodeCounts instanceof Float64Array)||nodeCounts.length!==1)throw TypeError('prepared node counter required');\n  const g=geometry,profile=");
source=source.replace('    nodes:0,cutoffs:0','    nodeCounts,cutoffs:0').replaceAll('state.nodes+=1;','state.nodeCounts[0]+=1;').replace('state.nodes=state.cutoffs=','state.frontierLast=-1;\n  state.nodeCounts[0]=state.cutoffs=').replace('nodes:s.nodes,','nodes:s.nodeCounts[0],');
source=source.replace(/    frontCalls:0,frontExact:0,frontFailures:0,frontSteps:0,frontActionExact:0,\n/,'');
source=source.replace('  state.frontCalls=state.frontExact=state.frontFailures=state.frontSteps=state.frontActionExact=state.cofactors=0;','  state.cofactors=0;');
source=source.replace('  frontCalls:s.frontCalls,frontExact:s.frontExact,\n  frontFailures:s.frontFailures,frontSteps:s.frontSteps,frontActionExact:s.frontActionExact,cofactors:s.cofactors','  cofactors:s.cofactors');
source=source.replace('connect4RbaCanonicalize,connect4RbaTerminal,connect4RbaRank','connect4RbaCanonicalize');
source=source.replaceAll('export function createConnect4RbaExactCache32Frontier','function createConnect4RbaExactCache32Frontier');
// Public standalone cache wrappers are not used by this solver.
source=source.replace(/export function probeConnect4RbaExactCache32Frontier[\s\S]*?(?=function resetConnect4RbaExactCache32Frontier)/,'');
source=source.replace('// This first candidate deliberately pays for full-window root probes. Count','// The selected algorithm pays for full-window root probes. Count');
source='// GENERATED by tools/build-root-frontier.mjs; do not edit manually.\n// Source SHA256 '+createHash('sha256').update(base).digest('hex')+'\n'+source;
const path=new URL('../addons/rba-connect4-frontier.mjs',import.meta.url);
if(process.argv.includes('--check'))assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),source);
else writeFileSync(path,source);

// Same cold publication/cancellation owner as the optional behavior worker.
let worker=readFileSync(new URL('../addons/rba-connect4-lazy-smp-worker-behavior.mjs',import.meta.url),'utf8').replaceAll('\r\n','\n');
worker=worker.replace('// GENERATED by tools/build-behavior-search.mjs; do not edit manually.','// GENERATED by tools/build-root-frontier.mjs; do not edit manually.');
worker=worker.replace("'./rba-connect4-alphabeta-behavior.mjs'","'./rba-connect4-frontier.mjs'")
  .replaceAll('prepareConnect4RbaAlphaBetaBehavior','prepareConnect4RbaFrontier').replaceAll('solveConnect4RbaAlphaBetaBehavior','solveConnect4RbaFrontier').replaceAll('RBA_AB_CPC_ONLY_BEHAVIOR','RBA_FRONTIER_CPC_ONLY');
worker=worker.replace('  state=prepareConnect4RbaFrontier({','  timing=new Float64Array(workerData.timingBuffer,index*64,2),\n  frontierMetrics=new Float64Array(workerData.frontierMetricBuffer,index*32,4),\n  state=prepareConnect4RbaFrontier({');
worker=worker.replace('    geometry:workerData.geometry,','    geometry:workerData.geometry,\n    nodeCounts:new Float64Array(workerData.nodeCounterBuffer,index*64,1),');
worker=worker.replace('  result=solveConnect4RbaFrontier(','  started=(timing[0]=performance.now()),\n  result=solveConnect4RbaFrontier(');
worker=worker.replace('  m=result.metrics;','  m=result.metrics;\ntiming[1]=performance.now();\nfrontierMetrics[0]=m.frontierPasses;frontierMetrics[1]=m.horizonStops;\nfrontierMetrics[2]=m.frontierAutoReleases;frontierMetrics[3]=m.frontierPending;');
for(const name of ['frontCalls','frontExact','frontFailures','frontSteps','frontActionExact'])worker=worker.replace('=m.'+name+';','=0;');
const workerPath=new URL('../addons/rba-connect4-lazy-smp-worker-frontier.mjs',import.meta.url);
if(process.argv.includes('--check'))assert.equal(readFileSync(workerPath,'utf8').replaceAll('\r\n','\n'),worker);
else writeFileSync(workerPath,worker);
