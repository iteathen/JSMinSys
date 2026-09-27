// Experimental execution-only worker. The publisher owns ALL mode selection.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const base=readFileSync(new URL('./frontier.generated.mjs',import.meta.url),'utf8').replaceAll('\r\n','\n');
function once(s,a,b){assert.equal(s.split(a).length,2,a);return s.replace(a,b);}
let source=once(base,"from './controls.mjs'","from './mode-controls.mjs'");
source=once(source,"  if(process.env.JSMINSYS_FLAG_DISPATCH!=='actions')throw RangeError('PFIF requires actions dispatch');\n",'');
source=once(source,'    frontierPending:0,frontierAutoReleases:0,',
  '    modeResolved:new Uint8Array(levels*g.columns),modeRegions:0,modePasses:0,modeRetainedSkips:0,');
source=once(source,'orientation,liveOffset,orderRow,alpha,beta){','orientation,liveOffset,orderRow,alpha,beta,limit){');
source=once(source,'if(depth>=state.frontierLimit)','if(state.searchShallow&&depth>=limit)');
source=once(source,'    let best=-2,unfinished=0;\n    for(let ai=0;ai<actionCount;ai+=1){',`
    // HOT execution only. A SHALLOW command traverses bounded local bands;
    // DEEP bypasses their horizon. No expansion scoring, re-arm, narrowing
    // threshold, usefulness test or self-selected mode. DO NOT REMOVE.
    const region=state.searchShallow&&limit===g.cellCount;
    const resolved=state.modeResolved;
    let passLimit=limit,best=-2;
    if(region){
      passLimit=Math.min(g.cellCount,depth+state.modeStride);
      state.modeRegions+=1;state.modePasses+=1;
      for(let ai=0;ai<actionCount;ai++)resolved[orderRow+ai]=0;
    }
    // Query-local retention only: beta fixed, alpha monotone; fail-low remains
    // dominated and fail-high closes the query. Markers are never TT facts.
    while(true){
    let unfinished=0;
    for(let ai=0;ai<actionCount;ai+=1){
      if(region&&resolved[orderRow+ai]){state.modeRetainedSkips+=1;continue;}`);
source=once(source,'          childLiveOffset,childOrderRow,-beta,-alpha);',
  '          childLiveOffset,childOrderRow,-beta,-alpha,passLimit);');
source=once(source,'      if(best===1)break;','      if(best===1)break;\n      if(region)resolved[orderRow+ai]=1;');
source=once(source,'    if(unfinished)return completeBehaviorNode32(state,4);',`
    if(unfinished){
      if(!region)return completeBehaviorNode32(state,4);
      state.modePasses+=1;
      // Mechanical iteration within the COMMANDED mode. Only a strategist
      // write changes modes. At physical exhaustion no horizon is needed.
      passLimit=state.searchShallow?Math.min(g.cellCount,passLimit+state.modeStride):g.cellCount;
      continue;
    }`);
source=once(source,'    return completeBehaviorNode32(state, sign*best);\n  }\n}\nexport function solve',
  '    return completeBehaviorNode32(state, sign*best);\n    }\n  }\n}\nexport function solve');
source=once(source,'  state.frontierValues.fill(-2);state.frontierPasses=state.horizonStops=state.frontierAutoReleases=state.frontierPending=0;',
  '  state.frontierValues.fill(-2);state.frontierPasses=state.horizonStops=state.modeRegions=state.modePasses=state.modeRetainedSkips=0;');
source=once(source,'  state.frontierLimit=state.frontierStride||g.cellCount;\n  state.frontierPending=actionCount;\n  releaseNarrowFrontier(state);',
  '  state.frontierLimit=state.searchShallow?state.modeStride:g.cellCount;');
source=once(source,'            live.stateWords,g.columns,-2,2);',
  '            live.stateWords,g.columns,-2,2,state.frontierLimit);');
source=once(source,'        state.frontierPending-=1;\n        releaseNarrowFrontier(state);','');
source=once(source,'    state.frontierLimit=state.frontierStride?Math.min(g.cellCount,state.frontierLimit+state.frontierStride):g.cellCount;',
  '    state.frontierLimit=state.searchShallow?Math.min(g.cellCount,state.frontierLimit+state.modeStride):g.cellCount;');
const start=source.indexOf('// Root-boundary action only;'),end=source.indexOf('// Cold operation boundary only:',start);
assert.ok(start>0&&end>start);source=source.slice(0,start)+source.slice(end);
source=once(source,'frontierPending:s.frontierPending,frontierAutoReleases:s.frontierAutoReleases,',
  'modeRegions:s.modeRegions,modePasses:s.modePasses,modeRetainedSkips:s.modeRetainedSkips,modeChanges:s.campaignChanges,');
source=source.replaceAll('frontierValues','modeRootValues').replaceAll('frontierPasses','modeRootPasses')
  .replaceAll('frontierLimit','modeRootLimit').replaceAll('frontierResult','modeResult');
// CPC-only specialization: the upstream template also supports four-front
// execution, but this worker rejects it. Do not carry its dead setup/storage
// or fabricate zero front metrics in the mode worker and its derived profiles.
source=once(source,',connect4RbaTerminal,connect4RbaRank','');
source=once(source,'export const RBA_AB_CPC_FOUR_FRONT_BEHAVIOR=1;\n','');
source=once(source,'  boundaryDepth=2,\n  boundaryCapacity=256,\n  boundaryBudget=100000,\n','');
source=once(source,"  if(mode!==RBA_AB_CPC_ONLY_BEHAVIOR&&mode!==RBA_AB_CPC_FOUR_FRONT_BEHAVIOR)throw new RangeError('invalid alpha-beta mode');\n",'');
source=once(source,'return prepareSearchBehavior32({g,profile,mode,cpc:','return prepareSearchBehavior32({g,profile,cpc:');
source=once(source,'    front:null,modeRootValues:','    modeRootValues:');
source=once(source,`    actionLo:mode===RBA_AB_CPC_FOUR_FRONT_BEHAVIOR?new Int8Array(levels*g.columns):null,
    actionHi:mode===RBA_AB_CPC_FOUR_FRONT_BEHAVIOR?new Int8Array(levels*g.columns):null,
    actionKnown:mode===RBA_AB_CPC_FOUR_FRONT_BEHAVIOR?new Uint8Array(levels*g.columns):null,
`,'');
source=once(source,'    frontCalls:0,frontExact:0,frontFailures:0,frontSteps:0,frontActionExact:0,\n','');
source=once(source,'  state.frontCalls=state.frontExact=state.frontFailures=state.frontSteps=state.frontActionExact=state.cofactors=0;',
  '  state.cofactors=0;');
source=once(source,`  frontCalls:s.frontCalls,frontExact:s.frontExact,
  frontFailures:s.frontFailures,frontSteps:s.frontSteps,frontActionExact:s.frontActionExact,cofactors:s.cofactors};}`,
  '  cofactors:s.cofactors};}');
source=`// EXPERIMENT GENERATED by build-modes.mjs; never edit manually.\n// Input SHA256 ${createHash('sha256').update(base).digest('hex')}\n`+source;
const path=new URL('./modes.generated.mjs',import.meta.url);
if(process.argv.includes('--check'))assert.equal(readFileSync(path,'utf8').replaceAll('\r\n','\n'),source);
else writeFileSync(path,source);
