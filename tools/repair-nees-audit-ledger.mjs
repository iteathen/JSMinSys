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
}else if(action==='review-affinity'){
 const source='addons/rba-connect4-prepared-session-host.mjs',graph=ledger.isomaxSystemCycleGraph;
 const op=(op,count,target)=>({op,count,...(target?{target}:{})});
 const add=(name,operations,parameters)=>{
  const id=source+'#'+name;assert.ok(!ledger.units.some(u=>u.unit===id));
  ledger.units.push({unit:id,source,name,scope:'cold-prepared-report-callback',status:'decomposed',operations,
   cycleCount:{kind:'symbolic',expression:cycleExpressionForOperations(operations),parameters,
    note:'Actual inline reporting callback; parent owns Array.from/callback construction. No E0 reporting or measured native-latency assumption.'}});
  graph.callbackTargets[id]=[id];return id;
 };
 const completed=add('<prepared-completion-callback>',[op('atomic.load.u32',1),op('alu.imul.u32',1),op('alu.add.u32',1)],{});
 const affinity=add('<prepared-affinity-callback>',[
  op('atomic.load.u32','5-DARWIN'),op('runtime.object.allocate',1),op('runtime.field.store',8),
  op('runtime.array.reference.load',4),op('runtime.field.load',3),op('alu.imul.u32','5-DARWIN'),
  op('alu.add.u32','2-DARWIN'),op('control.test.u32',6),op('control.branch',3)],
  {DARWIN:'1 for macOS, otherwise0. Four atomic loads for macOS and five Windows/Linux; six-worker Windows reporting therefore owns30loads.'});
 const parent=ledger.units.find(u=>u.source===source&&u.name==='materializePreparedConnect4SearchResult32');
 for(const o of parent.operations){
  if(o.op==='runtime.array.from'||o.op==='runtime.function.allocate')o.count='1+AFFINITY';
  if(o.op==='runtime.object.allocate')o.count=2;
  if(o.op==='atomic.load.u32')o.count='3+RESULT_DONE+2*EXACT';
  if(o.op==='alu.imul.u32')o.count='2*EXACT';
 }
 parent.operations.push(op('runtime.callback','W',completed),op('runtime.callback','W*AFFINITY',affinity));
 parent.cycleCount.parameters.AFFINITY='1 when affinityState supplied;0 otherwise.';
 parent.cycleCount.expression=cycleExpressionForOperations(parent.operations);
 parent.cycleCount.note='Dynamic result/timing fields plus explicit completion and affinity callback bodies. Six Windows workers add30atomic loads and6small objects, charged outside E0. Resource snapshot is a separate helper.';
 // The state API also reports readiness/verification with two eager Array.from callbacks.
 ledger.localOperationExtensions['runtime.array.every']={cost:{kind:'symbolic',name:'ARRAY_EVERY_COST(length,checked,V8)'},note:'Cold Array.every(Boolean) including reached built-in predicate calls. Early exit length remains variable, never zero by assumption.'};
 const ready=add('<prepared-affinity-ready-callback>',[op('atomic.load.u32',1),op('alu.imul.u32',1),op('control.test.u32',1)],{}),
  verified=add('<prepared-affinity-verified-callback>',[op('atomic.load.u32',1),op('alu.imul.u32',1),op('control.test.u32',1)],{}),
  state=ledger.units.find(u=>u.source===source&&u.name==='preparedConnect4SearchState32');
 state.operations.push(op('runtime.array.from','2*AFFINITY'),op('runtime.function.allocate','2*AFFINITY'),
  op('runtime.array.every','2*AFFINITY'),op('runtime.callback','W*AFFINITY',ready),op('runtime.callback','W*AFFINITY',verified));
 Object.assign(state.cycleCount.parameters,{AFFINITY:'1 if affinity state supplied, else0.',W:'Requested workers, both Array.from bodies execute for everyworker before native every short-circuits.'});
 state.cycleCount.expression=cycleExpressionForOperations(state.operations);
 graph.roots=[...new Set([...graph.roots,state.unit])];
 for(const u of ledger.units)if((u.cycleCount.unboundedTerms??[]).includes('PARK_DURATION'))
  u.cycleCount.parameters.PARK_DURATION='Explicit unbounded scheduler wait duration; not a constant, primitive multiplier, or zero-cost claim.';
 ledger.summary.units=ledger.units.length;ledger.summary.decomposed=ledger.units.filter(u=>u.status==='decomposed').length;
 ledger.summary.localExtensionOperations=Object.keys(ledger.localOperationExtensions).length;
}else if(action==='cold-boundary'){
 const ingress='addons/rba-connect4-ingress.mjs',host='addons/rba-connect4-prepared-session-host.mjs';
 const get=(source,name)=>{const u=ledger.units.find(u=>u.source===source&&u.name===name);assert.ok(u);return u;};
 const op=(op,count,target)=>({op,count,...(target?{target}:{})});
 const add=(source,name,operations,parameters,note)=>{
  assert.ok(!ledger.units.some(u=>u.source===source&&u.name===name),'one-shot reviewed inventory already applied');
  ledger.units.push({unit:source+'#'+name,source,name,scope:'cold-application-boundary',status:'decomposed',operations,
   cycleCount:{kind:'symbolic',expression:cycleExpressionForOperations(operations),parameters,note}});
 };
 ledger.localOperationExtensions['runtime.array.is_array.check']={cost:{kind:'symbolic',name:'ARRAY_IS_ARRAY_COST(type,map)'},note:'Cold ingress Array.isArray predicate; V8 realization not assigned zero cost.'};
 add(ingress,'validateConnect4MoveHistory32',[
  op('runtime.array.is_array.check',1),op('runtime.view.check','VIEW'),op('runtime.instanceof.check','DV'),
  op('runtime.field.load','ACCEPTED*2'),op('runtime.number.safe_integer.check','ACCEPTED'),
  op('control.test.u32','TEST'),op('control.branch','TEST'),op('runtime.error.throw','ERR')],
  {VIEW:'1 when input is not an Array;0 otherwise.',DV:'1 only when reached view is tested against DataView.',
   ACCEPTED:'1 when Array or non-DataView typed array shape reaches length/capacity check.',
   TEST:'Actually executed short-circuit shape/length/capacity predicates; no external iteration or index reads.',ERR:'1 on reached throwing path;0 otherwise.'},
  'Runs before ingress allocations. Fixed bounded length is returned; per-column legality remains owned by the caller.');
 for(const name of ['connect4RbaFromMoves','connect4PositionCode64FromMoves']){
  const u=get(ingress,name);
  u.operations.push(op('runtime.call.subledger',1,'validateConnect4MoveHistory32'),op('runtime.array.reference.load','M'),op('control.test.u32','M+1'),op('control.branch','M+1'));
  u.cycleCount.expression=cycleExpressionForOperations(u.operations);
  u.cycleCount.note+=' Fixed indexed ingress, never user-defined iterators. RBA reads original once and replays its owned history for optional position code. E3 one-shot construction remains inside primary solve interval.';
 }
 add(host,'preparedInitializationAllowed32',[
  op('runtime.field.load','SIG'),op('runtime.timer.read','LIVE'),op('runtime.number.subtract','LIVE'),
  op('control.test.u32','1+LIVE'),op('control.branch','1+LIVE')],
  {SIG:'1 if signal supplied, else0.',LIVE:'1 when signal is not already aborted; elapsed-time check otherwise short-circuits.'},
  'Cooperative COLD checks before compilers, admission, allocation and each worker launch. Does not preempt synchronous compilation/allocation. Not executed by E0 recurrence.');
 const dynamic={FIELDS:'Actually executed metadata property reads, including optional/nullish and bank byteLength reads; excludes callee internals.',
  STORES:'Actual metadata property writes into the fresh scalar/width result object.',TESTS:'Actually evaluated metadata short-circuit/ternary/loop predicates.',
  ADDS:'Executed byte-count additions and key-width arithmetic.',MULTS:'Executed width/capacity multiplications.',MIXED:'1 for mixed16/24 layout;0 otherwise.',
  SHARED_SCAN:'1 if a shared split cache was allocated and sharedViewBytes32 is reached.',GEOMETRY_SCAN:'1 if shared geometry allocated;0 otherwise.',
  BANKS:'Banks explicitly iterated only when payloadBytes absent;0 otherwise.'};
 add(host,'preparedConnect4ResourceMetadata32',[
  op('runtime.object.allocate',1),op('runtime.array.allocate','2*MIXED'),op('runtime.field.load','FIELDS'),op('runtime.field.store','STORES'),
  op('control.test.u32','TESTS'),op('control.branch','TESTS'),op('runtime.number.multiply','MULTS'),op('alu.add.u32','ADDS'),
  op('runtime.iterator.advance','BANKS'),op('runtime.call.subledger','SHARED_SCAN+GEOMETRY_SCAN','sharedViewBytes32')],dynamic,
  'Snapshot allocated resource sizes before reference release. Width arrays contain only numbers. No geometry/TT/root reference enters snapshot. sharedBytes records prepared allocation, not live post-close RSS. Cold costs remain symbolic on actual Intel/Node27.');
 add(host,'releasePreparedConnect4Resources32',[
  op('runtime.call.subledger',1,'ManagedThreadSession.close'),op('runtime.promise.await',1),
  op('runtime.call.subledger',1,'preparedConnect4ResourceMetadata32'),op('runtime.timer.read',1),op('runtime.event.listener','SIG')],
  {SIG:'1 when supplied signal listener is removed;0 otherwise.'},
  'First close only: join workers, capture scalar metadata, clear root/cache/shared geometry/input geometry references, then mark cleanup finished. Control/result/ready planes remain for state/result. JS GC/RSS release timing is not guaranteed.');
 Object.assign(get(host,'releasePreparedConnect4Resources32').cycleCount,{kind:'unbounded',minCycles:0,
  unboundedTerms:['CALL(ManagedThreadSession.close)','C(runtime.promise.await)']});
 const close=get(host,'closePreparedConnect4Search32');
 close.operations=close.operations.map(o=>o.target==='ManagedThreadSession.close'?{...o,target:'releasePreparedConnect4Resources32'}:
  o.op==='runtime.timer.read'?{...o,count:'NEW'}:o.op==='runtime.event.listener'?{...o,count:'NEW*SIG'}:o);
 close.cycleCount.expression=cycleExpressionForOperations(close.operations);
 if(close.cycleCount.unboundedTerms)close.cycleCount.unboundedTerms=close.cycleCount.unboundedTerms.map(t=>t.replace('CALL(ManagedThreadSession.close)','CALL(releasePreparedConnect4Resources32)'));
 const material=get(host,'materializePreparedConnect4SearchResult32');
 material.operations=material.operations.filter(o=>!(o.target==='sharedViewBytes32'||
  ['runtime.field.load','alu.add.u32','runtime.number.multiply','control.test.u32','control.branch','runtime.field.store','runtime.cold.tt.bank.initialize'].includes(o.op)));
 material.operations.push(op('runtime.call.subledger','RESOURCE','preparedConnect4ResourceMetadata32'),op('runtime.object.spread',1),
  op('runtime.field.load','FIELDS'),op('runtime.field.store','STORES'),op('alu.add.u32','ADDS'),op('control.test.u32','TESTS'),op('control.branch','TESTS'));
 Object.assign(material.cycleCount.parameters,{RESOURCE:'1 only without cached scalar resource snapshot;0 after close.',
  FIELDS:'Executed managed-result/timing/affinity property reads outside metadata callee.',STORES:'Executed result/timing/affinity object field writes.',
  ADDS:'Executed result/affinity index additions.',TESTS:'Executed status/timing/nullish/affinity predicates outside metadata callee.'});
 material.cycleCount.expression=cycleExpressionForOperations(material.operations);
 material.cycleCount.note='Result/state remains valid after large-owned-reference release; metadata is charged to its own helper. No hidden root/cache references. Array.from completion/affinity callbacks retain existing cold accounting; source model is not measured native latency.';
 const prepare=get(host,'prepareLazySmpConnect4Rba32');
 prepare.operations=prepare.operations.map(o=>o.op==='runtime.function.allocate'?{...o,count:9}:o);
 prepare.operations.push(op('runtime.call.subledger','ADMISSION_CHECKS','preparedInitializationAllowed32'));
 Object.assign(prepare.cycleCount.parameters,{ADMISSION_CHECKS:'Actually reached compiler/admission/allocation/worker-loop checks;0..4+requested workers.',
  INIT:'1 only when preparation passes abort/deadline check and allocations proceed.',
  PLAN:'1 iff positive support budget and live cooperative deadline permits compiler.',COMPILE:'1 iff full basis-view admission and live cooperative deadline permits transition compiler.'});
 prepare.cycleCount.expression=cycleExpressionForOperations(prepare.operations);
 prepare.cycleCount.activeCycleExpression=prepare.cycleCount.expression;
 prepare.cycleCount.note+=' Three new named COLD closures; deadline is checked around synchronous stages and before every worker launch, not a preemption promise. Closed app clears its large owned references.';
 for(const u of ledger.units.filter(u=>u.source===ingress||u.source===host))
  if(u.cycleCount.activeCycleExpression!==undefined&&u.cycleCount.expression!==undefined)u.cycleCount.activeCycleExpression=u.cycleCount.expression;
 ledger.summary.units=ledger.units.length;ledger.summary.decomposed=ledger.units.filter(u=>u.status==='decomposed').length;
 ledger.summary.localExtensionOperations=Object.keys(ledger.localOperationExtensions).length;
 refreshReviewedSourceGuards(ledger,new Set([ingress,host]));
}else throw Error('Unknown scoped NEES ledger repair: '+action);
writeFileSync(path,JSON.stringify(ledger,null,2)+'\n');
