// Offline C53merger cost delta; apply once to retainedC52ledger.
import {readFileSync,writeFileSync} from 'node:fs';
const path='catalog/addon-cycle-ledger-v0.json',l=JSON.parse(readFileSync(path,'utf8')),
 source='addons/connect4-cpcx-pair-hub.mjs',op=(name,count,target)=>({op:name,count,...target?{target}:{}}),
 expr=ops=>ops.map(o=>`(${o.count})*`+(o.op==='runtime.call.subledger'?`CALL(${o.target})`:`C(${o.op})`)).join('+');
if(l.units.some(u=>u.name==='collectConnect4CpcxSingletons32'))throw Error('C53already applied');
const prep=l.units.find(u=>u.source===source&&u.name==='prepareConnect4CpcxPairHub32');
prep.operations.find(o=>o.op==='runtime.typed_array.allocate').count=4;
prep.operations.find(o=>o.op==='runtime.function.allocate').count=3;
prep.operations.find(o=>o.op==='runtime.field.store').count=7;
prep.operations.push(op('runtime.math.ceil',1),op('runtime.number.divide',1),op('runtime.number.multiply',1),op('alu.add.u32',3));
prep.cycleCount.expression=expr(prep.operations);
prep.cycleCount.note+=' C53one forbidden-column u32field per depth preallocated atinit; ceil(columns/32)words, no32column cap. Array bytes4*(cellCount+1)*forbiddenWords. Additional collector closure and three public prepared studs are cold.';
const find=l.units.find(u=>u.source===source&&u.name==='findConnect4CpcxPairHub32');
find.operations=find.operations.filter(o=>!(o.op==='runtime.call.subledger'&&o.target==='connect4RbaExposesOpponentWin'));
find.operations.find(o=>o.op==='memory.load.u32').count='SOURCE+BASIS+CHECKS';
find.operations.push(op('alu.shr.u32','CHECKS'),op('alu.shl.u32','CHECKS'),op('alu.and.u32','2*CHECKS'),op('runtime.field.load','CTX'));
find.cycleCount.parameters.CHECKS='Positive unique trigger candidates reading current frame forbidden bit instead of C05binary search.';
find.cycleCount.parameters.CTX='Actually reached captured context-slot loads; optimizer may hoist/eliminate after inlining, not assumed free.';
delete find.cycleCount.parameters.HEIGHT;
find.cycleCount.expression=expr(find.operations);
find.cycleCount.note+=' C53C05predicate supplied by current exact singleton collector, frame-specific across recursion. No child dependency, no per-candidate binary search. Captured context-slot loading is explicitly charged; source-only preload does not imply free registers.';
const spoke=l.units.find(u=>u.source===source&&u.name==='addSpoke');spoke.operations.push(op('runtime.field.load','CTX'));spoke.cycleCount.parameters.CTX='Actually reached scratch context-slot loads.';spoke.cycleCount.expression=expr(spoke.operations);
const operations=[op('runtime.field.load','CTX'),op('memory.store.u32','FW+HAZARDS'),op('memory.load.u32','BASIS+BITS+3*ACTIVE+HAZARDS'),
 op('alu.add.u32','ADD'),op('alu.shr.u32','SHR'),op('alu.shl.u32','SHL'),op('alu.and.u32','AND'),op('control.test.u32','TEST'),op('control.branch','BRANCH')];
l.units.push({unit:source+'#collectConnect4CpcxSingletons32',source,name:'collectConnect4CpcxSingletons32',scope:'cpcx-singleton-header-hot',operations,
 cycleCount:{kind:'symbolic',expression:expr(operations),parameters:{CTX:'Actual captured dimensions, geometry views, owner offsets and forbidden storage reads.',FW:'Prepared forbiddenWords reset for this one frame.',HAZARDS:'Active opponent singletons exactly one row above their landing.',BASIS:'Singleton prefix plus first non-singleton stop, if reached.',BITS:'Opponent coordinate memberships read for prefixslots.',ACTIVE:'Active singleton cells; column,row and supportheight loads.',ADD:'Frame/slot/word address, increment and height+1 operations.',SHR:'Coordinate/column word indices.',SHL:'Coordinate membership and hazard column bit masks.',AND:'Slot/column low bits and memberships.',TEST:'Loop/cardinality/active/frontier/duplicate/depth-one predicates actually reached.',BRANCH:'Reached loop/short-circuit/return branches.'},
 note:'Exact C01/C05predicates together. Dual frontier returns-2; completed hazard mask not required on that early loss path. Parent maskframe survives nested children. No allocation/telemetry/async/physical-terminal mutation.'},status:'decomposed'});
for(const u of l.units.filter(u=>u.source.includes('worker-minimal'))){const key=u.cycleCount.activeCycleExpression?'activeCycleExpression':'expression';
 if(u.name==='negamax'){
  u.operations=u.operations.filter(o=>!(o.op==='runtime.call.subledger'&&['connect4RbaForcedResponseColumn','connect4RbaExposesOpponentWin'].includes(o.target)));
  u.operations.push(op('runtime.call.subledger','TACT','collectConnect4CpcxSingletons32'),op('alu.imul.u32','TACT'),op('memory.load.u32','A'),
   op('alu.shr.u32','A'),op('alu.shl.u32','A'),op('alu.and.u32','2*A'),op('alu.add.u32','A'));
  u.cycleCount.note+=' C53current forbidden base established after cache exits, collector replaces C01and every per-action C05call. Added source bitfield load/word/bit addressing explicitly charged. Bound/publication/order semantics unchanged.';
 }else if(u.name==='<module-main>'){
  u.operations.push(op('runtime.field.load',3));u.cycleCount.note+=' C53collector/mask-array/mask-word-width bound at initialization, not a hot configuration test.';
 }else continue;
 u.cycleCount[key]=expr(u.operations);
}
writeFileSync(path,JSON.stringify(l,null,2)+'\n');
