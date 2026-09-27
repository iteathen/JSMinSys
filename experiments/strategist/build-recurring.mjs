// Experimental, local recurrence specialization. Never edit generated output.
// The ordinary worker and one-way frontier control remain separate controls.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const base=readFileSync(new URL('./frontier.generated.mjs',import.meta.url),'utf8').replaceAll('\r\n','\n');
function once(source,from,to){assert.equal(source.split(from).length,2,from);return source.replace(from,to);}
let source=once(base,'    frontierPending:0,frontierAutoReleases:0,',`    frontierPending:0,frontierAutoReleases:0,
    recurringResolved:new Uint8Array(levels*g.columns),recurringRegions:0,recurringPasses:0,
    recurringReleases:0,recurringReentries:0,recurringLocalReentries:0,recurringRetainedSkips:0,recurringMaxDepth:0,
    recurringBudgetReleases:0,recurringRearms:0,`);
source=once(source,'orientation,liveOffset,orderRow,alpha,beta){','orientation,liveOffset,orderRow,alpha,beta,limit,lineage){');
source=once(source,'if(depth>=state.frontierLimit)','if(depth>=limit)');
source=once(source,'    if(forced>=0){',`    if(forced>=0){
      // A forced continuation is observed narrowing. Re-arm only after that
      // evidence, not at every wide node after an unproductive probe.
      if(lineage===-2){lineage=depth;state.recurringRearms+=1;}`);
source=once(source,'    let best=-2,unfinished=0;\n    for(let ai=0;ai<actionCount;ai+=1){',`
    // HOT recurring action. Reuse already-generated actions and this native
    // frame. Probe regions only during unconstrained advancement; a bounded
    // probe never recursively launches another probe region. DO NOT REMOVE.
    const region=state.frontierRecurring&&lineage!==-2&&state.recurringStride>0&&limit===g.cellCount&&actionCount>1;
    const resolved=state.recurringResolved;
    let passLimit=limit,childLineage=lineage,pending=actionCount,best=-2;
    if(lineage===-2&&pending<=state.frontierTarget){childLineage=depth;state.recurringRearms+=1;}
    if(region){
      state.recurringRegions+=1;state.recurringPasses+=1;
      if(lineage>=0)state.recurringReentries+=1;
      if(lineage>0)state.recurringLocalReentries+=1;
      if(depth>state.recurringMaxDepth)state.recurringMaxDepth=depth;
      if(pending<=state.frontierTarget){
        childLineage=depth;state.recurringReleases+=1;
      }else passLimit=Math.min(g.cellCount,depth+state.recurringStride);
      for(let ai=0;ai<actionCount;ai++)resolved[orderRow+ai]=0;
    }
    // A retained completion is scoped to this query, not global exact WDL.
    // Beta stays fixed and alpha only rises. A fail-low child stays dominated;
    // a fail-high ends the query immediately. Never publish these markers to TT.
    while(true){
    let unfinished=0;
    for(let ai=0;ai<actionCount;ai+=1){
      if(region&&resolved[orderRow+ai]){state.recurringRetainedSkips+=1;continue;}`);
source=once(source,'          childLiveOffset,childOrderRow,-beta,-alpha);',
  '          childLiveOffset,childOrderRow,-beta,-alpha,passLimit,childLineage);');
source=once(source,'      if(best===1)break;',`      if(best===1)break;
      // A cutoff above has no continuation to retain; only open queries pay
      // marker writes and narrowing decisions.
      if(region){
        resolved[orderRow+ai]=1;pending-=1;
        if(pending<=state.frontierTarget&&(passLimit<g.cellCount||childLineage===-2)){
          passLimit=g.cellCount;childLineage=depth;state.recurringReleases+=1;
        }
      }else if(childLineage===-2){
        pending-=1;
        if(pending<=state.frontierTarget){childLineage=depth;state.recurringRearms+=1;}
      }`);
source=once(source,'    if(unfinished)return completeBehaviorNode32(state,4);',`
    if(unfinished){
      if(!region)return completeBehaviorNode32(state,4);
      // Advance from THIS branch, not the external root. Parent native state,
      // order, alpha, best and completed-query markers survive the next pass.
      state.recurringPasses+=1;
      if(state.recurringBounded&&passLimit<g.cellCount&&pending>state.frontierTarget){
        // One band per expansion. -2 suppresses more probes until native
        // advancement observes narrowing. No new scheduler or TT metadata.
        passLimit=g.cellCount;childLineage=-2;state.recurringBudgetReleases+=1;
      }else passLimit=state.frontierRecurring?Math.min(g.cellCount,passLimit+state.recurringStride):g.cellCount;
      continue;
    }`);
source=once(source,'    return completeBehaviorNode32(state, sign*best);\n  }\n}\nexport function solve',
  '    return completeBehaviorNode32(state, sign*best);\n    }\n  }\n}\nexport function solve');
source=once(source,'  state.nodes=state.cutoffs=state.cacheHits=state.cpcExact=state.cpcBounds=state.cpcRestrictions=0;',`
  state.recurringRegions=state.recurringPasses=state.recurringReleases=state.recurringReentries=0;
  state.recurringLocalReentries=state.recurringRetainedSkips=state.recurringMaxDepth=0;
  state.recurringBudgetReleases=state.recurringRearms=0;
  state.nodes=state.cutoffs=state.cacheHits=state.cpcExact=state.cpcBounds=state.cpcRestrictions=0;`);
source=once(source,'            live.stateWords,g.columns,-2,2);',
  '            live.stateWords,g.columns,-2,2,state.frontierLimit,state.frontierAutoReleases?0:-1);');
source=once(source,'function metricsBehavior(s){return {',`function metricsBehavior(s){return {
  recurringRegions:s.recurringRegions,recurringPasses:s.recurringPasses,recurringReleases:s.recurringReleases,
  recurringReentries:s.recurringReentries,recurringLocalReentries:s.recurringLocalReentries,
  recurringRetainedSkips:s.recurringRetainedSkips,recurringMaxDepth:s.recurringMaxDepth,
  recurringBudgetReleases:s.recurringBudgetReleases,recurringRearms:s.recurringRearms,`);
source=`// EXPERIMENT GENERATED by build-recurring.mjs; never edit manually.\n// Input SHA256 ${createHash('sha256').update(base).digest('hex')}\n`+source;
const path=new URL('./recurring.generated.mjs',import.meta.url);
if(process.argv.includes('--check'))assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),source);
else writeFileSync(path,source);
