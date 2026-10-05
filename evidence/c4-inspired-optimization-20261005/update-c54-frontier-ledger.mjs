// Offline cost identities; never linked into timed workers. Apply once.
import {readFileSync,writeFileSync} from 'node:fs';
const path='catalog/addon-cycle-ledger-v0.json',l=JSON.parse(readFileSync(path,'utf8')),
 op=(name,count,target)=>({op:name,count,...target?{target}:{}}),
 expr=ops=>ops.map(o=>`(${o.count})*`+(o.op==='runtime.call.subledger'?`CALL(${o.target})`:`C(${o.op})`)).join('+');
if(l.units.some(u=>u.source.includes('connect4-residual-proof-frontier')))throw Error('C54already applied');
function add(source,name,scope,operations,parameters,note){l.units.push({unit:source+'#'+name,source,name,scope,operations,
 cycleCount:{kind:'symbolic',expression:expr(operations),parameters,note},status:'decomposed'});}
const wrapper='addons/connect4-residual-proof-frontier.mjs';
add(wrapper,'prepareConnect4ResidualProofFrontier32','cold-residual-proof-bind',[
 op('runtime.field.load',1),op('control.test.u32',1),op('control.branch',1),
 op('runtime.call.subledger','THREE','prepareConnect4ResidualProofFrontierThree32'),
 op('runtime.call.subledger','1-THREE','prepareConnect4ResidualProofFrontierSpan32')],
 {THREE:'Actual init geometry coordinate span equals3; no board-width/height literal or hot configuration flag.'},'Cold monomorphic generated native3 or general-span binding.');
for(const three of [false,true]){
 const source='addons/connect4-residual-proof-frontier-'+(three?'three':'span')+'.mjs',suffix=three?'3':'32',
  name=base=>base+suffix,parameters={CTX:'Actually reached captured view/dimension/context-slot reads; not assumed free because prepared.',NATIVE:'3fornative or actual coordinate span for general family.',W:'Active valid coordinate words inspected, shortened by first failed subset predicate.',TEST:'Actually reached short-circuit/loop/threshold predicates.',BRANCH:'Corresponding reached branches.',ADDR:'Actual native array/frame/record/owner address additions.'},
  unit=(base,operations,extra,note,scope='residual-proof-hot')=>add(source,name(base),scope,operations,{...parameters,...extra},note);
 add(source,three?'prepareConnect4ResidualProofFrontierThree32':'prepareConnect4ResidualProofFrontierSpan32','cold-residual-proof-plan',[
  op('runtime.field.load','FIELDS'),op('runtime.math.floor',1),op('runtime.number.divide',1),op('runtime.number.multiply','MUL'),
  op('runtime.typed_array.allocate','2*ENABLED'),op('runtime.function.allocate','FUNCTIONS'),op('runtime.object.allocate',1),
  op('runtime.field.store','RETURN_FIELDS'),op('memory.store.u32','PRETOUCH'),op('alu.sub.u32','SUB'),
  op('alu.add.u32','ADD'),op('control.test.u32','TEST'),op('control.branch','BRANCH')],
  {FIELDS:'Cold geometry/complete-plan/view/byte-length reads.',MUL:'Stride/frame/payload/capacity arithmetic.',ENABLED:'1when complete closure+mirror plan and at leastone budgeted bucket exist.',FUNCTIONS:'Actual hoisted function closures allocated;11declared, optimizer elimination not assumed.',RETURN_FIELDS:'Method bindings/native views/footprint metadata returned.',PRETOUCH:'Enabled payload+frame words zero-touched before worker readiness.',SUB:'Capacity-1, native coordinate extent.',ADD:'Stride/frame/capacity computations.',TEST:'Cold admission/capacity-loop predicates.',BRANCH:'Reached admission/capacity-loop/return branches.'},
  'Payload<=2MiB/worker plus8*(cellCount+1)frame bytes. Rule-only geometry, current-run entries start empty, no outcome data. Native3derived from span authority; no hot allocation/telemetry.');
 unit('inactiveResidualProof',[op('control.branch','RET')],{RET:'Return control transfer when actual call survives; monomorphic inlining may fold it away.'},'No-op fallback; hot call/inlining debt charged at caller, no allocations or data access.');
 unit('setResidualProofFrame',[
  op('runtime.field.load','CTX'),op('alu.shr.u32',1),op('alu.xor.u32',1),op('alu.imul.u32',1),op('alu.and.u32',1),
  op('runtime.number.multiply',2),op('alu.add.u32',1),op('memory.store.u32',2)],{},'Exact support id and derived bucket base retained once per frame; collisions retain full support header checks.');
 unit('initializeResidualProof',[
  op('runtime.field.load','CTX'),op('memory.load.u32','2*C'),op('runtime.number.multiply','C'),op('alu.add.u32','ADD'),
  op('control.test.u32','C+1'),op('control.branch','C+1'),op('runtime.call.subledger',1,name('setResidualProofFrame'))],
  {C:'Actual columns, one support-handle calculation AFTER root words copied/readiness.',ADD:'Support/frame/stride addresses, loop increments and sum.'},'Position-dependent root setup included in primary interval; root never queried/stored.');
 unit('childResidualProof',[
  op('runtime.field.load','CTX'),op('control.test.u32',1),op('control.branch',1),op('memory.load.u32','REFLECTED'),
  op('runtime.call.subledger',1,name('setResidualProofFrame'))],
  {REFLECTED:'1iff actual physical canonicalization reflected child; exact mirrorProfiles row then used.'},'Complete closure cofactor publishes handle; fallback binds no-op instead of interpreting generic scratch.');
 for(const predicate of ['queryAboveResidualProof','residualProofAboveQuery'])unit(predicate,[
  op('runtime.field.load','CTX'),op('memory.load.u32','READS'),op('alu.shr.u32',1),op('alu.and.u32','MASKS'),
  op('alu.not.u32','COMP'),op('alu.add.u32','ADDR'),op('control.test.u32','TEST'),op('control.branch','BRANCH')],
  {READS:'Up to4pervalidword; second owner source read occurs only after first inclusion test succeeds.',MASKS:'Tail computation, source validity and reached inclusion ANDs.',COMP:'Reached subset complements, using AND-with-complement==0 to handle signed bit31.'},
  'Full aligned residual-ideal containment. Native3prefix0/32/64 and tailguards exactly reproduce span authority; no cardinality/orientation/value heuristic.');
 unit('probeResidualProof',[
  op('runtime.field.load','CTX'),op('memory.load.u32','READS'),op('memory.load.native_index',1),op('runtime.number.multiply',1),
  op('alu.add.u32','ADDR'),op('control.test.u32','TEST'),op('control.branch','BRANCH'),
  op('runtime.call.subledger','LOWER',name('queryAboveResidualProof')),op('runtime.call.subledger','UPPER',name('residualProofAboveQuery'))],
  {READS:'Frame handle/base, full support header and reached threshold reads.',LOWER:'1only when lower lane exact support header matches.',UPPER:'1only when upper header matches and no exactlowerWINreturned.'},
  'After existing probeCache returns0only. Absolute thresholds transport through exact support/mover; bothzero directions imply draw. Root excluded.');
 unit('saveResidualProof',[
  op('runtime.field.load','CTX'),op('memory.load.u32','2*NATIVE'),op('memory.store.u32','2*NATIVE+2'),
  op('alu.shr.u32',1),op('alu.and.u32','MASKS'),op('alu.add.u32','ADDR'),op('control.test.u32','TEST'),op('control.branch','BRANCH')],
  {MASKS:'Source validity masks and tail, actual three-word/general-span writes.'},'One native record copy only after deterministic replacement accepts it, never synthesize owner unions or joins across supports.');
 for(const lane of ['Lower','Upper'])unit('store'+lane+'ResidualProof',[
  op('runtime.field.load','CTX'),op('memory.load.u32','HEADER'),op('alu.add.u32','ADDR'),op('control.test.u32','TEST'),op('control.branch','BRANCH'),
  op('runtime.call.subledger','COMPARE',name(lane==='Lower'?'queryAboveResidualProof':'residualProofAboveQuery')),
  op('runtime.call.subledger','SAVE',name('saveResidualProof'))],
  {HEADER:'Support header and tag only after same-support test.',COMPARE:'Equal-threshold same-support dominance test before overwriting broader proof.',SAVE:'1when different support/strongerthreshold/newbroaderorincomparable proof is retained.'},'Current-run-only deterministic replacement; no adapted state/rank exception.');
 unit('storeResidualProof',[
  op('runtime.field.load','CTX'),op('memory.load.u32',2),op('memory.load.native_index',1),op('runtime.number.multiply',1),
  op('alu.add.u32','ADDR'),op('control.test.u32','TEST'),op('control.branch','BRANCH'),
  op('runtime.call.subledger','LOWER',name('storeLowerResidualProof')),op('runtime.call.subledger','UPPER',name('storeUpperResidualProof'))],
  {LOWER:'ExactP0WIN/draw or localzero-bound transported to absolute lower.',UPPER:'ExactP1WIN/draw or transported absoluteupper.'},'No remoteness or action witness. Caller forwards explicit depth/mover; all exact tags absolute, local4/5decoded solely by mover.');
}
for(const u of l.units.filter(u=>u.source.includes('worker-minimal'))){
 const k=u.cycleCount.activeCycleExpression?'activeCycleExpression':'expression';
 if(u.name==='<module-main>'){
  u.operations.push(op('runtime.call.subledger',1,'prepareConnect4ResidualProofFrontier32'),op('runtime.field.load',4),
   op('runtime.call.subledger','THREE*ENABLED','initializeResidualProof3'),op('runtime.call.subledger','(1-THREE)*ENABLED','initializeResidualProof32'));
 }else if(u.name==='negamax'){
  u.operations.push(op('runtime.call.subledger','MISS*THREE*ENABLED','probeResidualProof3'),op('runtime.call.subledger','MISS*(1-THREE)*ENABLED','probeResidualProof32'),
   op('runtime.call.subledger','R*THREE*ENABLED','childResidualProof3'),op('runtime.call.subledger','R*(1-THREE)*ENABLED','childResidualProof32'),
   op('memory.load.u32','R'),op('control.test.u32','MISS'),op('control.branch','MISS'));
 }else if(u.name==='storeExact'||u.name==='storeBound'){
  u.operations.push(op('runtime.call.subledger','STORES*THREE*ENABLED','storeResidualProof3'),op('runtime.call.subledger','STORES*(1-THREE)*ENABLED','storeResidualProof32'));
 }else continue;
 Object.assign(u.cycleCount.parameters,{THREE:'Actual coordinate span3, cold selection.',ENABLED:'Complete immutable closure+reflection plans admitted; else monomorphic no-op path.',MISS:'Non-root existing cache misses0; no added frontier query on exact OR zero-bound hit.',STORES:u.name==='storeBound'?'1incoming proved bound plus1only when opposite localzero bounds join exactdraw.':'1perproved exact entry.'});
 u.cycleCount[k]=expr(u.operations);
 u.cycleCount.note+=' C54private residual-order frontier, exactTT unchanged. Rootsetup after readiness, childframe from exact cofactor/mirrorhandle, explicit depth/mover storeparameters. No hot reporting; actual captured view/context/register and inlining costs remain optimization debt before profiling. Added native payload2MiB/worker plus frames atstandard3words; no existingTTbudget reduced.';
}
writeFileSync(path,JSON.stringify(l,null,2)+'\n');
