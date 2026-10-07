// Explicit, scoped cold accounting repairs for the20261006 audit. No broad source resealing.
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {cycleExpressionForOperations} from './cycle-ledger-validation.mjs';
import {refreshReviewedSourceGuards} from './cycle-source-guards.mjs';
const path='catalog/addon-cycle-ledger-v0.json',ledger=JSON.parse(readFileSync(path,'utf8'));
const action=process.argv[2];
if(action==='symbols'){
 const affected=ledger.units.filter(u=>u.source==='addons/rba-connect4-shared-exact-cache-layout.mjs'&&
  ['createConnect4RbaSharedLayoutCache32','attachConnect4RbaSharedLayoutCache32'].includes(u.name));
 assert.equal(affected.length,2);
 for(const u of affected)Object.assign(u.cycleCount.parameters,{
  IC:'Executed cold integer/safe-integer predicates; path dependent, not assumed zero.',
  FS:'Executed cold descriptor/object field assignments; excludes callee internals.',
  OA:'Executed cold descriptor/object allocations; size/lifetime and engine cost remain explicit.',
  ERR:'1 on the reached throwing failure path;0 on successful creation/attachment.',
 });
}else if(action==='callbacks'){
 for(const u of ledger.units)if(u.operations.some(o=>o.op==='runtime.callback'))
  u.cycleCount.expression=cycleExpressionForOperations(u.operations);
 const graph=ledger.isomaxSystemCycleGraph;
 for(const name of ['probeIndexPartial24Shared32','probeBankedIndexPartial24Shared32',
  'storeIndexPartial24Shared32','storeBankedIndexPartial24Shared32',
  'probeIndexPartialMixedShared32','storeIndexPartialMixedShared32']){
  const matches=ledger.units.filter(u=>u.name===name);assert.equal(matches.length,1);
  graph.callbackTargets[name]=[matches[0].unit];
 }
 const source='addons/connect4-cpc-matching-response.mjs',name='<matching-slot-identity-callback>',id=source+'#'+name;
 if(!ledger.units.some(u=>u.unit===id))ledger.units.push({unit:id,source,name,scope:'cold-geometry-matching-slot-identity',status:'decomposed',
  operations:[{op:'runtime.native.access.lowering',count:'ABI'}],cycleCount:{kind:'symbolic',
   expression:'(ABI)*C(runtime.native.access.lowering)',parameters:{ABI:'Tagged argument-index return/call ABI for Array.from((_,i)=>i); source performs no arithmetic. Engine lowering unqualified, not zero.'},
   note:'Inline source callback at prepareConnect4CpcMatchingResponse32 line13. Parent owns Array.from/function construction; this callee owns argument/result propagation only.'}});
 graph.callbackTargets['cold-local-slot-identity']=[id];
 ledger.summary.units=ledger.units.length;ledger.summary.decomposed=ledger.units.filter(u=>u.status==='decomposed').length;
}else if(action==='graph'){
 const graph=ledger.isomaxSystemCycleGraph;
 graph.roots=[...new Set([...graph.roots,
  'addons/rba-connect4-prepared-session-host.mjs#prepareLazySmpConnect4Rba32',
  'addons/rba-connect4-prepared-session-host.mjs#solvePreparedConnect4Search32',
  'addons/rba-connect4-prepared-session-host.mjs#closePreparedConnect4Search32',
  'addons/worker-topology.mjs#discoverWorkerPlan',
  'addons/worker-startup-affinity.mjs#<module-main>',
  'addons/isomax-memory-profile.mjs#discoverAvailableSolverMemory32',
  'addons/isomax-memory-profile.mjs#estimateIsoMaxPreparationReserve32',
  'addons/isomax-memory-profile.mjs#selectIsoMaxMemoryProfile32',
  ...ledger.units.filter(u=>/^addons\/rba-connect4-lazy-smp-worker-minimal.*\.mjs$/.test(u.source)&&u.name==='<module-main>').map(u=>u.unit)])];
 for(const [target,pattern] of Object.entries({
  sharedProbe:/^(probeSharedPreparedBankedCompact32|probeBankedDirect32)$/,
  sharedStore:/^(storeSharedPreparedBankedCompact32|storeBankedDirect32)$/,
  SELECTED_NATIVE_PROBE:/^probe(?:Compact|Direct|FullSpan)SharedCache(?:Counted)?32$/,
  SELECTED_NATIVE_STORE:/^store(?:Compact|Direct|FullSpan)SharedCache(?:Counted)?32$/,
 }))graph.callbackTargets[target]=[...new Set([...(graph.callbackTargets[target]??[]),...ledger.units.filter(u=>pattern.test(u.name)).map(u=>u.unit)])];
 for(const u of ledger.units.filter(u=>u.source==='addons/rba-connect4-shared-banked-cache.mjs')){
  for(const o of u.operations)if(['SELECTED_NATIVE_PROBE','SELECTED_NATIVE_STORE'].includes(o.target))o.op='runtime.callback';
  u.cycleCount.expression=cycleExpressionForOperations(u.operations);
 }
 graph.resolution='Source-local functions first, named import aliases/canonical imports next, exact sealed binding or unique explicit class/prepared semantic unit last. Ambiguity fails closed.';
}else if(action==='completion'){
 for(const u of ledger.units.filter(u=>/^addons\/rba-connect4-lazy-smp-worker-minimal.*\.mjs$/.test(u.source)&&u.name==='<module-main>')){
  for(const o of u.operations){
   if(o.op==='atomic.store.u32'&&(o.count===4||o.count==='4*COMPLETED+WINNER'))o.count='4*COMPLETED+WINNER';
   if(o.op==='atomic.rmw.u32'&&(o.count===2||o.count==='COMPLETED+WINNER'))o.count='COMPLETED+WINNER';
   if(o.op==='atomic.notify'&&(o.count===1||o.count==='WINNER'))o.count='WINNER';
  }
  u.cycleCount.parameters.COMPLETED='1 iff relative!==CANCELLED and result row published;0 on cancelled path.';
  u.cycleCount.parameters.WINNER='1 iff COMPLETED and winner compareExchange succeeds;0 otherwise. Must not be1 when COMPLETED=0.';
  u.cycleCount.parameters.TEST=u.cycleCount.parameters.TEST.replace('CANCELLED sentinel handling is removed.','CANCELLED sentinel guard remains; publication occurs only on completed paths.');
  u.cycleCount.expression=cycleExpressionForOperations(u.operations);
 }
}else if(action==='windows'){
 const sources=new Set(ledger.units.filter(u=>/^addons\/rba-connect4-lazy-smp-worker-minimal.*\.mjs$/.test(u.source)).map(u=>u.source));
 assert.equal(sources.size,32);
 for(const u of ledger.units.filter(u=>sources.has(u.source)&&u.name==='negamax')){
  u.operations=u.operations.filter(o=>o.note!=='Integer window/score ABI normalization');
  u.operations.push({op:'runtime.native.access.lowering',count:'2*RECURSE+RETURNED',note:'Integer window/score ABI normalization'});
  Object.assign(u.cycleCount.parameters,{
   RECURSE:'Actual nonterminal child negamax calls from this node, before exact cutoff/cancellation;0..legal child count.',
   RETURNED:'Noncancelled recursive child returns whose score is negated; <=RECURSE. CANCELLED bypasses score normalization.',
  });
  u.cycleCount.expression=cycleExpressionForOperations(u.operations);
  u.cycleCount.note=(u.cycleCount.note??'')+' Internal windows remain integer {-2..2}; scores {-1,0,1}, cancelled=-2 checked before negation. Three source int32 normalizations per completed recursion are realization-sensitive, not automatically three native OR instructions.';
 }
 refreshReviewedSourceGuards(ledger,sources);
}else throw Error('Unknown scoped NEES ledger repair: '+action);
writeFileSync(path,JSON.stringify(ledger,null,2)+'\n');
