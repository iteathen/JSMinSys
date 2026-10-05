// Offline experiment bookkeeping. Never imported by the timed solver.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const path='catalog/addon-cycle-ledger-v0.json',ledger=JSON.parse(readFileSync(path,'utf8'));
const experiment=process.argv[2],sources=process.argv.slice(3);
if(experiment==='C17')for(const center of [false,true]){
 const base='addons/rba-connect4-lazy-smp-worker-minimal'+(center?'-center':'')+'.mjs',
  generated=base.replace('.mjs','-proofs.mjs');
 for(const old of ledger.units.filter(u=>u.source===base)){
  const copy=structuredClone(old);copy.source=generated;copy.unit=generated+'#'+old.unit.split('#')[1];
  ledger.units.push(copy);
 }
}
const workers=ledger.units.filter(u=>sources.includes(u.source)&&u.source.includes('worker-minimal'));
function append(u,operation,expression,parameters,note){
 u.operations.push(operation);
 const key=u.cycleCount.activeCycleExpression?'activeCycleExpression':'expression';
 u.cycleCount[key]+='+'+expression;
 Object.assign(u.cycleCount.parameters,parameters);
 u.cycleCount.note+=' '+note;
}
if(experiment==='C17'){
 const source='addons/rba-connect4-shared-proof-cache.mjs';
 ledger.units.push({unit:source+'#transportConnect4ZeroBound32',source,name:'transportConnect4ZeroBound32',scope:'shared-zero-bound-gauge',status:'decomposed',
  operations:[{op:'control.test.u32',count:'T'},{op:'control.branch',count:1},{op:'alu.sub.u32',count:'S'}],
  cycleCount:{kind:'expression',expression:'T*C(control.test.u32)+C(control.branch)+S*C(alu.sub.u32)',parameters:{T:'One tag-range test plus mover test only for bound tags.',S:'1 only when a bound changes player gauge.'},note:'C17 involutive gauge transport; exact absolute tags untouched. E1, no allocation/reporting. Actual inlining/Intel cost unqualified before full solve.'}});
 ledger.units.push({unit:source+'#prepareSharedProofCacheAccess',source,name:'prepareSharedProofCacheAccess',scope:'cold-shared-proof-bind',status:'decomposed',
  operations:[{op:'runtime.field.load',count:1},{op:'control.test.u32',count:1},{op:'control.branch',count:1},{op:'runtime.call.subledger',count:'N',target:'prepareSharedCacheAccess'},{op:'runtime.object.allocate',count:'1-N'},{op:'runtime.field.store',count:'2*(1-N)'}],
  cycleCount:{kind:'expression',expression:'C(runtime.field.load)+C(control.test.u32)+C(control.branch)+N*CALL(prepareSharedCacheAccess)+(1-N)*C(runtime.object.allocate)+2*(1-N)*C(runtime.field.store)',parameters:{N:'1 for native layout, zero for the legacy split representation.'},note:'COLD binding of unchanged exact-key publication primitives for a homogeneous minimal proof pool; protocol, identity and record size unchanged.'}});
 for(const u of workers){
  if(u.name==='probeCache'){
   append(u,{op:'runtime.call.subledger',count:'S',target:'transportConnect4ZeroBound32'},'S*CALL(transportConnect4ZeroBound32)+S*C(memory.load.u32)+S*C(alu.shr.u32)+S*C(alu.and.u32)',{},'C17 all shared probes decode absolute zero bounds to mover gauge before worker-local retention, including shared misses.');
   u.operations.push({op:'memory.load.u32',count:'S'},{op:'alu.shr.u32',count:'S'},{op:'alu.and.u32',count:'S'});
  }
  if(u.name==='storeBound'){
   append(u,{op:'runtime.call.subledger',count:'PUB',target:'transportConnect4ZeroBound32'},'PUB*CALL(transportConnect4ZeroBound32)+PUB*CALLBACK(sharedStore)+PUB*C(memory.load.u32)+PUB*C(alu.shr.u32)+PUB*C(alu.and.u32)+C(alu.and.u32)+C(control.test.u32)+C(control.branch)',{PUB:'1 when a new local bound is admitted by unchanged shared sampling; existing same/exact or inferred local draw returns without publication.'},'C17 publishes newly retained zero bounds in absolute gauge using unchanged atomic protocol; opposite local bounds still imply private exact draw.');
   u.operations.push({op:'runtime.callback',count:'PUB',target:'sharedStore'},{op:'memory.load.u32',count:'PUB'},{op:'alu.shr.u32',count:'PUB'},{op:'alu.and.u32',count:'PUB+1'},{op:'control.test.u32',count:1},{op:'control.branch',count:1});
  }
 }
}else if(experiment==='C18'){
 for(const u of workers.filter(u=>u.name==='negamax')){
  append(u,{op:'control.test.u32',count:1},'C(control.test.u32)+C(control.branch)',{},'C18 runs whole/target certificates only when forced<0; forced legal responses retain normal transition/reflection/window/terminal path. CP/TD/TG now count only branching nodes.');
  u.operations.push({op:'control.branch',count:1});
 }
}else if(experiment==='C19'){
 for(const u of ledger.units.filter(u=>sources.includes(u.source)&&u.name.includes('Cofactor')&&u.name.includes('KnownHeight'))){
  // N now counts only active visits. Owner words are loaded once per W;
  // source-mask extraction adds unary negation, xor and clz to each N.
  const replacements=new Map([
   ['memory.load.u32',c=>c.replace('2*N','2*W')],
   ['alu.and.u32',c=>c+'+K'],
   ['alu.shr.u32',c=>c.replace('+N','')+'+2*K'],
   ['alu.or.u32',c=>c.replace('N+','W+')],
   ['alu.xor.u32',c=>c+'+N'],['alu.clz.u32',c=>c+'+N']
  ]);
  const key=u.cycleCount.activeCycleExpression?'activeCycleExpression':'expression';
  for(const op of u.operations)if(replacements.has(op.op)){
   const before=String(op.count),after=replacements.get(op.op)(before);
   u.cycleCount[key]=u.cycleCount[key].replace(`(${before})*C(${op.op})`,`(${after})*C(${op.op})`);
   op.count=after;
  }
  Object.assign(u.cycleCount.parameters,{N:'Active parent basis bits visited in increasing index order, bounded by n; zero on terminal paths.',W:'ceil(n/32) owner-union words scanned on nonterminal construction; final word masked to n. SUBTRACT/ADD/TEST/BRANCH include per-word scan and per-active-bit extraction rather than inactive-slot tests.'});
  u.cycleCount.note+=' C19 active union traversal preserves increasing slot order and closure-before-absorption. Unary bit negation/index subtraction is in SUBTRACT; word-address and index additions in ADD; loops/tail/short-circuit selections in TEST/BRANCH. Word count and tail-mask shifts are included; no claim of measured Intel savings.';
 }
}else if(experiment==='C20'){
 ledger.localOperationExtensions['memory.allocate.private.bytes']={cost:{kind:'symbolic',name:'PRIVATE_ARRAY_BUFFER_ALLOC(bytes,pageState,gcState)'},note:'Cold private backing-store allocation/zeroing; actual page costs are not fixed.'};
 function unit(source,name,operations,parameters,note){
  ledger.units.push({unit:source+'#'+name,source,name,scope:'private-native-proof-cache',status:'decomposed',operations,
   cycleCount:{kind:'symbolic',expression:operations.map(o=>`(${o.count})*`+(o.op==='runtime.call.subledger'?`CALL(${o.target})`:`C(${o.op})`)).join('+'),parameters,note}});
 }
 const src='addons/rba-connect4-local-native-proof-cache.mjs',call=(target,count=1)=>({op:'runtime.call.subledger',count,target});
 unit(src,'createLocalNativeProofCache32',[call('isCompactProfile8'),call('validateConnect4CacheCapacity32'),
  {op:'runtime.field.load',count:1},{op:'control.test.u32',count:1},{op:'control.branch',count:1},{op:'runtime.error.throw',count:'BAD'},
  {op:'runtime.number.multiply',count:1},{op:'memory.allocate.private.bytes',count:1},{op:'runtime.typed_view.construct',count:2},
  {op:'runtime.object.allocate',count:1},{op:'runtime.field.store',count:2}],{BAD:'1 on invalid geometry; valid path allocates exactly capacity*32 bytes and two aliased views.'},'COLD native compact-profile-only private allocation. Host selects unchanged split fallback for other dimensions. No atomics or hot allocation.');
 unit(src,'localNativeProofKeyMatches32',[{op:'runtime.field.load',count:2},{op:'runtime.number.multiply',count:2},
  {op:'memory.load.native_index',count:'HALF'},{op:'memory.load.u32',count:'KEY+SOURCE'},
  {op:'alu.add.u32',count:'ADD'},{op:'control.test.u32',count:'FIELD'},{op:'control.branch',count:'FIELD-1'},
  call('compactSupportProfile8','SUPPORT'),call('compactTailProfile8','TAIL')],
  {HALF:'Reached halfword loads: at most3.',KEY:'Reached record uint32 identity loads: at most5.',SOURCE:'Reached direct source loads: at most6, excludes callee loads.',ADD:'Executed offset/record address additions, at most14.',FIELD:'Reached equality predicates among eight exact fields.',SUPPORT:'1 if support comparison reached.',TAIL:'1 if tail comparison reached.',INDEX_BYTES:'2 for halfword fields; native-index vocabulary is width-sensitive.'},'HOT short-circuit equality on unchanged injective compact identity. No decoder, rank or token labels added. Actual inlining/cache line/alignment/bounds guards remain measured-machine debt.');
 unit(src,'storeLocalNativeProofEntry32',[{op:'runtime.field.load',count:2},{op:'runtime.number.multiply',count:2},
  {op:'memory.load.u32',count:6},{op:'memory.store.u32',count:6},{op:'memory.store.native_index',count:3},
  {op:'alu.add.u32',count:14},call('compactSupportProfile8'),call('compactTailProfile8')],{INDEX_BYTES:'2 for native halfwords.'},'HOT private publication writes eight identity fields then native uint32 tag. Same replacement/bounds semantics, no concurrency protocol needed for one owning worker.');
 for(const center of [false,true])for(const proof of [false,true]){
  const base='addons/rba-connect4-lazy-smp-worker-minimal'+(center?'-center':'')+(proof?'-proofs':'')+'.mjs',generated=base.replace('.mjs','-local32.mjs');
  for(const old of ledger.units.filter(u=>u.source===base)){
   const copy=structuredClone(old);copy.source=generated;copy.unit=generated+'#'+old.unit.split('#')[1];
   if(copy.name==='localKeyMatches'||copy.name==='storeLocalEntry'){
    const target=copy.name==='localKeyMatches'?'localNativeProofKeyMatches32':'storeLocalNativeProofEntry32';
    copy.operations=[call(target)];copy.cycleCount={kind:'expression',expression:'CALL('+target+')',parameters:{},note:'C20 monomorphic private-native library call; the wrapper retains worker API. Compiler inlining is not assumed free.'};
   }else if(copy.name==='probeCache'||copy.name==='storeBound'){
    for(const o of copy.operations)if(o.op==='memory.load.u8')o.op='memory.load.u32';
    const key=copy.cycleCount.activeCycleExpression?'activeCycleExpression':'expression';
    copy.cycleCount[key]=copy.cycleCount[key].replaceAll('C(memory.load.u8)','C(memory.load.u32)')+'+C(runtime.number.multiply)';
    copy.operations.push({op:'runtime.number.multiply',count:1});
    copy.cycleCount.note+=' C20 native tag at slot*8; exact/bound logic and shared protocol unchanged.';
   }else if(copy.name.includes('main')){
    copy.cycleCount.note+=' C20 private cache allocation uses createLocalNativeProofCache32; warm-up fills one backing view rather than separate keys/values. Cold allocation and page warming remain included in operation cost.';
    copy.operations.push(call('createLocalNativeProofCache32'));
    const key=copy.cycleCount.activeCycleExpression?'activeCycleExpression':'expression';copy.cycleCount[key]+='+CALL(createLocalNativeProofCache32)';
   }
   ledger.units.push(copy);
  }
 }
}else if(experiment==='C21'){
 ledger.localOperationExtensions['runtime.math.floor']={cost:{kind:'symbolic',name:'NUMBER_FLOOR_COST(profile,lowering)'},note:'Cold nonnegative support digit division rounding; no per-node use.'};
 function unit(source,name,operations,parameters,note){
  ledger.units.push({unit:source+'#'+name,source,name,scope:'support-basis-plan',status:'decomposed',operations,
   cycleCount:{kind:'symbolic',expression:operations.map(o=>`(${o.count})*`+(o.op==='runtime.call.subledger'?`CALL(${o.target})`:o.op==='runtime.callback'?`CALLBACK(${o.target})`:`C(${o.op})`)).join('+'),parameters,note}});
 }
 const source='addons/rba-connect4-support-basis-plan.mjs',call=(target,count=1)=>({op:'runtime.call.subledger',count,target});
 unit(source,'prepareSupportBasisPlans32',[
  {op:'runtime.number.safe_integer.check',count:'CHECK'},{op:'runtime.error.throw',count:'BAD'},
  {op:'runtime.field.load',count:'FIELD'},{op:'control.test.u32',count:'TEST'},{op:'control.branch',count:'BRANCH'},
  {op:'runtime.number.multiply',count:'MUL'},{op:'runtime.number.divide',count:'DIV'},{op:'runtime.math.floor',count:'DIV'},
  {op:'runtime.number.remainder',count:'REM'},{op:'alu.add.u32',count:'ADD'},{op:'alu.sub.u32',count:'SUB'},
  {op:'memory.allocate.shared.bytes',count:'4*ADMIT'},{op:'runtime.typed_view.construct',count:'4*ADMIT'},
  {op:'runtime.typed_array.allocate',count:'2*ADMIT'},{op:'runtime.object.allocate',count:'ADMIT'},
  {op:'runtime.object.freeze',count:'ADMIT'},{op:'runtime.field.store',count:'7*ADMIT'},
  {op:'memory.load.u32',count:'LOAD32'},{op:'memory.load.native_index',count:'LOADID'},
  {op:'memory.store.u32',count:'STORE32'},{op:'memory.store.native_index',count:'P'},
  {op:'alu.and.u32',count:'IMAGE'},{op:'alu.or.u32',count:'IMAGE'},{op:'alu.shl.u32',count:'IMAGE'},
  {op:'alu.shr.u32',count:'IMAGE'},
  call('prepareConnect4RbaExecutionProfile','ADMIT'),call('connect4RbaBasisFromSupport','ADMIT'),
  call('emitSortedSetBitsAt32','P-ADMIT'),{op:'runtime.callback',count:'P-ADMIT',target:'prepareRemove'},
  {op:'runtime.callback',count:'VISIT',target:'removePrepared'},{op:'runtime.array.copy',count:'ADMIT'}],
  {ADMIT:'0 on cold budget/index fallback;1 on admitted plan.',P:'Admitted support profile count, including root;0 on fallback.',VISIT:'Sum of parent basis sizes traversed while preparing non-root profiles.',IMAGE:'Surviving nonempty residual images.',LOADID:'Native basis/size loads along preparation paths; width selected from geometry.',LOAD32:'Strides and mask read-modify-write loads.',STORE32:'Strides/membership writes, excluding sorted emission subledger.',CHECK:'Executed input/index/byte safe-integer checks.',BAD:'1 on invalid budget; allocation not reached.',FIELD:'Executed property loads, including width/budget checks.',TEST:'Executed predicates/loop checks/short-circuit conditions.',BRANCH:'Executed source control selections.',MUL:'Executed allocation/row/stride/cell/address multiplications.',DIV:'Executed nonnegative integer division then Math.floor while decoding the chosen nonzero support digit.',REM:'Executed remainder for support digit decoding.',ADD:'Executed numeric/address additions.',SUB:'Executed predecessor/landing subtractions.',INDEX_BYTES:'Basis IDs use1/2/4 bytes and sizes1/2/4 bytes based on geometry; no hot dispatch.'},
  'COLD rule-only preparation covers every support, including unreachable profiles. All allocation checked against budget/native indices before backing-store creation. Every profile completed before publication. No outcomes, moves, TT rows or runtime learning persisted. Preparation debt measured in initialization and whole-operation cycles.');
 unit(source,'loadSupportBasis32',[{op:'runtime.field.load',count:'FIELD'},
  {op:'memory.load.u32',count:'2*C+W'},{op:'memory.load.native_index',count:'1+N'},
  {op:'memory.store.u32',count:'N+W'},{op:'runtime.number.multiply',count:'C+2'},
  {op:'alu.add.u32',count:'ADD'},{op:'control.test.u32',count:'C+N+W+3'},
  {op:'control.branch',count:'C+N+W+3'}],
  {C:'Configured columns summed into the injective mixed-radix handle.',N:'Copied child basis size.',W:'Geometry shape-word count.',FIELD:'Executed geometry/plan/view properties including loop conditions; compiler hoisting not assumed.',ADD:'Address/loop/handle additions:4*C+3*N+3*W.',INDEX_BYTES:'Size/ID view widths selected cold; memory.load.native_index includes native width.'},
  'HOT reads immutable plan arrays and copies exact basis/membership into existing scratch. Source canonical support selects the canonical frame; no physical-column transporter is discarded. No allocation, mutation of plans or decoder dispatch.');
 for(const dense of [false,true]){
  const kind=dense?'Dense':'Prepared',base='addons/rba-connect4-coordinate-'+(dense?'dense':'prepared')+'.mjs',generated=base.replace('coordinate-','coordinate-support-');
  for(const old of ledger.units.filter(u=>u.source===base&&u.name.includes('Cofactor')&&u.name.includes('KnownHeight'))){
   const copy=structuredClone(old);copy.source=generated;copy.name=copy.name.replace('connect4Rba'+kind,'connect4RbaSupport'+kind);copy.unit=generated+'#'+copy.name;
   for(const o of copy.operations)if(o.op==='runtime.call.subledger'&&o.target==='connect4Rba'+kind+'CofactorBasis')o.target='loadSupportBasis32';
   const key=copy.cycleCount.activeCycleExpression?'activeCycleExpression':'expression';
   copy.cycleCount[key]=copy.cycleCount[key].replaceAll('CALL(connect4Rba'+kind+'CofactorBasis)','CALL(loadSupportBasis32)');
   if(dense){
    copy.operations.push({op:'runtime.number.multiply',count:'K'},{op:'alu.add.u32',count:'A'});
    copy.cycleCount[key]+='+K*C(runtime.number.multiply)+A*C(alu.add.u32)';
   }else{
    copy.operations.push({op:'runtime.callback',count:'K',target:'prepareRemove'},{op:'runtime.callback',count:'A',target:'removePrepared'});
    copy.cycleCount[key]+='+K*CALLBACK(prepareRemove)+A*CALLBACK(removePrepared)';
    copy.cycleCount.parameters.RS='Zero: removal callback replaces saved removed[] loads.';
   }
   copy.cycleCount.note+=' C21 complete support plan replaces basis rebuilding/sorting only. Existing inverse construction, active-owner projection and closure absorption remain; removal is read directly from dense geometry or sparse callback instead of saved removed scratch. Library/frame contract is otherwise unchanged.';
   ledger.units.push(copy);
  }
 }
}else if(experiment==='C23'){
 const source='addons/rba-connect4-support-basis-plan.mjs',call=(target,count=1)=>({op:'runtime.call.subledger',target,count});
 function unit(name,operations,parameters,note){ledger.units.push({unit:source+'#'+name,source,name,scope:'support-closure-plan',status:'decomposed',operations,cycleCount:{kind:'symbolic',expression:operations.map(o=>`(${o.count})*`+(o.op==='runtime.call.subledger'?`CALL(${o.target})`:`C(${o.op})`)).join('+'),parameters,note}});}
 unit('compileSupportClosures32',[
  {op:'runtime.typed_array.allocate',count:1},{op:'runtime.field.load',count:'FIELD'},
  {op:'memory.load.native_index',count:'ID'},{op:'memory.load.u32',count:'L32'},{op:'memory.store.u32',count:'S32'},
  {op:'runtime.number.multiply',count:'MUL'},{op:'alu.add.u32',count:'ADD'},{op:'alu.sub.u32',count:'SUB'},
  {op:'alu.and.u32',count:'H'},{op:'alu.or.u32',count:'N+V'},{op:'alu.shl.u32',count:'N+H+V'},
  {op:'alu.shr.u32',count:'N+V'},{op:'alu.clz.u32',count:'V'},{op:'alu.xor.u32',count:'V'},
  {op:'control.test.u32',count:'TEST'},{op:'control.branch',count:'BRANCH'}],
  {N:'Sum of all prepared basis sizes.',H:'Total strict-superset group intersections.',V:'Current-membership set bits enumerated.',ID:'Size/basis/group-word native view loads.',L32:'Offsets, membership, inverse and closure read-modify-write loads.',S32:'Inverse plus closure publications.',FIELD:'All cold geometry properties/loop bounds.',MUL:'Profile row/mask/closure address multiplications.',ADD:'All address/loop/index additions.',SUB:'Isolated-bit extraction and clz index subtraction.',TEST:'Loop and condition predicates.',BRANCH:'Source control selections.'},
  'COLD geometry/support-only compilation. Inverse IDs are licensed only by current-membership intersection. All immutable self+superset rows completed before workers start. No outcomes/hints. Whole-operation cycles include this cost; locality/compiler debt remains measured by full runs.');
 unit('loadSupportClosureBasis32',[
  {op:'runtime.field.load',count:'FIELD'},{op:'memory.load.u32',count:'2*C'},
  {op:'memory.load.native_index',count:'1+N'},{op:'memory.store.u32',count:'N+1'},
  {op:'runtime.number.multiply',count:'C+1'},{op:'alu.add.u32',count:'4*C+3*N'},
  {op:'control.test.u32',count:'C+N+2'},{op:'control.branch',count:'C+N+2'}],
  {C:'Configured columns.',N:'Child basis IDs copied.',FIELD:'All plan/geometry/view properties and loop bounds.'},
  'HOT exact support handle, basis copy and one handle write to existing scratch. Membership copying is removed; seen untouched. No allocation/decoder/layout selection.');
 for(const three of [false,true])unit(three?'applySupportClosure3x32':'applySupportClosureSpan32',[
  {op:'memory.load.u32',count:three?'3+3*OWN':'Z+Z*OWN'},
  {op:'memory.store.u32',count:three?'3*OWN':'Z*OWN'},
  {op:'alu.or.u32',count:three?'3*OWN':'Z*OWN'},
  {op:'alu.add.u32',count:three?'6+4*OWN':'Z*(3+2*OWN)'},
  {op:'control.test.u32',count:three?'2':'3*Z+1'},
  {op:'control.branch',count:three?'2':'3*Z+1'}],
  {Z:'Configured coordinate word count.',OWN:'write0+write1; at least one at projection call,0 permitted by standalone helper.'},
  'HOT cold-selected direct OR; closure words loaded once and reused for both owners. Three-word precondition enforced by initialization selection. No reporting/allocation or hot dimension dispatch.');
 const prep=ledger.units.find(u=>u.source===source&&u.name==='prepareSupportBasisPlans32');
 append(prep,call('compileSupportClosures32','CL'),'CL*CALL(compileSupportClosures32)+CL*C(memory.allocate.shared.bytes)+CL*C(runtime.typed_view.construct)+EXTRA*C(control.test.u32)+EXTRA*C(control.branch)',{CL:'1 if a complete closure plan is admitted;0 otherwise.',EXTRA:'New closure boolean/budget checks and optional allocation/export branches.'},'C23 cold working budget includes membership and closures; runtime exports no intermediate membership. Retained bytes exclude abandoned membership backing, workingBytes separately records construction payload; GC release time is not assumed.');
 prep.operations.push({op:'memory.allocate.shared.bytes',count:'CL'},{op:'runtime.typed_view.construct',count:'CL'},{op:'control.test.u32',count:'EXTRA'},{op:'control.branch',count:'EXTRA'});
 for(const dense of [false,true])for(const three of [false,true]){
  const kind=dense?'Dense':'Prepared',base='addons/rba-connect4-coordinate-support-'+(dense?'dense':'prepared')+'.mjs',generated=base.replace('coordinate-support','coordinate-closure');
  for(const old of ledger.units.filter(u=>u.source===base&&u.name.includes('KnownHeight'))){
   const copy=structuredClone(old);copy.source=generated;copy.name=copy.name.replace('Support'+kind,'Closure'+kind+(three?'3':'Span'));copy.unit=generated+'#'+copy.name;
   for(const o of copy.operations){if(o.op==='runtime.call.subledger'&&o.target==='loadSupportBasis32')o.target='loadSupportClosureBasis32';o.count=String(o.count).replace(/\b(H|V|E|O)\b/g,'0');}
   const key=copy.cycleCount.activeCycleExpression?'activeCycleExpression':'expression';
   copy.cycleCount[key]=copy.cycleCount[key].replaceAll('CALL(loadSupportBasis32)','CALL(loadSupportClosureBasis32)').replace(/\b(H|V|E|O)\b/g,'0');
   Object.assign(copy.cycleCount.parameters,{H:'Zero: no hot superset groups.',V:'Zero: no hot superset traversal.',E:'Zero: self publication included in closure helper.',O:'Zero: supersets published in closure helper.',Q:'J: only surviving image inverse lookup.',RS:'Zero: removed scratch carries handle only.',HANDLE:'K: one scratch handle read and two closure-base multiplies.',CLOSE_ADDR:'U: one closure-row multiplication and addition.'});
   append(copy,call(three?'applySupportClosure3x32':'applySupportClosureSpan32','U'),`U*CALL(${three?'applySupportClosure3x32':'applySupportClosureSpan32'})+HANDLE*C(memory.load.u32)+(2*HANDLE+CLOSE_ADDR)*C(runtime.number.multiply)+CLOSE_ADDR*C(alu.add.u32)`,{},'C23 replaces the strict-closure traversal and image writes with immutable complete closure OR after the unchanged absorption guard. FIELD/control/address symbols are actual executed source counts of this shorter kernel, not inherited fixed counts; no measured machine-cost inference.');
   copy.operations.push({op:'memory.load.u32',count:'HANDLE'},{op:'runtime.number.multiply',count:'2*HANDLE+CLOSE_ADDR'},{op:'alu.add.u32',count:'CLOSE_ADDR'});ledger.units.push(copy);
  }
 }
}else if(experiment==='C24'){
 const load=ledger.units.find(u=>u.name==='loadSupportClosureBasis32');
 for(const o of load.operations)if(o.op==='memory.store.u32')o.count='2*N+1';
 load.cycleCount.expression=load.cycleCount.expression.replace('(N+1)*C(memory.store.u32)','(2*N+1)*C(memory.store.u32)');
 load.cycleCount.note+=' C24 writes the current inverse with each copied ID; stale unrelated slots are neither cleared nor treated as membership.';
 for(const u of ledger.units.filter(u=>u.source.includes('coordinate-closure-'))){
  for(const o of u.operations)o.count=String(o.count).replace(/\bM\b/g,'0');
  const key=u.cycleCount.activeCycleExpression?'activeCycleExpression':'expression';u.cycleCount[key]=u.cycleCount[key].replace(/\bM\b/g,'0');
  u.cycleCount.parameters.M='Zero: inverse construction fused into basis-copy subledger.';
  u.cycleCount.note+=' C24 removes the immediate child-basis reread/inverse traversal; ADD/TEST/BRANCH count only remaining executed source operations.';
 }
}else if(experiment==='C22'){
 for(const u of workers.filter(u=>u.name==='storeBound')){
  append(u,{op:'runtime.callback',count:'JOIN_PUB',target:'sharedStore'},'D*C(alu.and.u32)+D*C(control.test.u32)+D*C(control.branch)+JOIN_PUB*CALLBACK(sharedStore)',
   {JOIN_PUB:'1 only when opposite same-key zero bounds join as exact draw and unchanged sampling admits publication;0 otherwise.'},
   'C22 generated proof pool publishes the previously private exact-draw join. Tag2 is absolute/gauge-invariant, so no extra gauge decode; exact-only default worker remains unchanged. No reporting/allocation or new replacement policy.');
  u.operations.push({op:'alu.and.u32',count:'D'},{op:'control.test.u32',count:'D'},{op:'control.branch',count:'D'});
 }
}else if(experiment!=='HASH')throw Error('unknown experiment');
if(ledger.units.some(u=>u.source==='addons/rba-connect4-support-basis-plan.mjs')){
 ledger.localOperationExtensions['runtime.math.floor']={cost:{kind:'symbolic',name:'NUMBER_FLOOR_COST(profile,lowering)'},note:'Cold nonnegative support digit division rounding; no per-node use.'};
 for(const u of ledger.units.filter(u=>u.source==='addons/rba-connect4-support-basis-plan.mjs')){
  for(const o of u.operations)if(o.op==='runtime.number.modulo')o.op='runtime.number.remainder';
  u.cycleCount.expression=u.cycleCount.expression.replaceAll('runtime.number.modulo','runtime.number.remainder');
 }
}
for(const source of sources){
 const s=readFileSync(source,'utf8').replaceAll('\r\n','\n');
 ledger.decomposedSourceBlobs[source]=createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
}
ledger.summary.units=ledger.units.length;
ledger.summary.localExtensionOperations=Object.keys(ledger.localOperationExtensions).length;
writeFileSync(path,JSON.stringify(ledger,null,2)+'\n');
