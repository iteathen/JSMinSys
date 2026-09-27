import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

// Experimental specialization only. Ordinary and ordinary behavior workers
// retain their original hot path. Fail closed if a source seam changes.
const base=readFileSync(new URL('./search.generated.mjs',import.meta.url),'utf8').replaceAll('\r\n','\n');
function replaceOnce(source,from,to){assert.equal(source.split(from).length,2,from);return source.replace(from,to);}
let source=base.slice(0,base.indexOf('function frontEvidenceBehavior'));
source=replaceOnce(source,"import {prepareConnect4RbaFrontArena,buildConnect4RbaFourFront,queryConnect4RbaFourFront} from '../../addons/rba-connect4-front.mjs';\n",'');
source=replaceOnce(source,'  const g=geometry,profile=',`  if(mode!==RBA_AB_CPC_ONLY_BEHAVIOR)throw RangeError('PFIF requires CPC-only');
  if(process.env.JSMINSYS_FLAG_DISPATCH!=='actions')throw RangeError('PFIF requires actions dispatch');
  const g=geometry,profile=`);
source=replaceOnce(source,`    front:mode===RBA_AB_CPC_FOUR_FRONT_BEHAVIOR
      ?prepareConnect4RbaFrontArena(g,{depth:boundaryDepth,capacity:boundaryCapacity,budget:boundaryBudget,profile})
      :null,`,`    front:null,frontierValues:new Int8Array(g.columns),frontierPasses:0,horizonStops:0,`);
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
source+=search;
let root=base.slice(base.indexOf('export function solveConnect4RbaAlphaBetaBehavior'),base.indexOf('  const childKey=g.keyWords,childBasis=g.maxBasis;'));
root=replaceOnce(root,'  resetConnect4RbaExactCache32Behavior(state.cache);',`  resetConnect4RbaExactCache32Behavior(state.cache);
  state.frontierValues.fill(-2);state.frontierPasses=state.horizonStops=0;`);
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
            live.stateWords,g.columns,-2,2);
          if(value===-3)return frontierResult(state,3,0,-1);
          if(value===-4){unfinished=1;continue;}
        }
        values[ai]=value;
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
// Cold operation boundary only: string status and result allocation never run
// at a recursive node or between frontier passes. Do not move them there.
function frontierResult(state,cancel,value,move){
  const mover=(state.words[state.g.metaOffset]>>>2)&1;
  return {status:cancel?'CANCELLED':'EXACT',value:cancel?null:value,
    relative:cancel?null:absToRelativeBehavior(value,mover),move,metrics:metricsBehavior(state)};
}
`;
let metrics=base.slice(base.indexOf('function metricsBehavior(s)'));
metrics=replaceOnce(metrics,'return {nodes:s.nodes,','return {frontierPasses:s.frontierPasses,horizonStops:s.horizonStops,frontierLimit:s.frontierLimit,nodes:s.nodes,');
source+=metrics;
source=`// EXPERIMENT GENERATED by build-frontier.mjs; never edit manually.\n// Input SHA256 ${createHash('sha256').update(base).digest('hex')}\n`+source;
const path=new URL('./frontier.generated.mjs',import.meta.url);
if(process.argv.includes('--check'))assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),source);
else writeFileSync(path,source);
