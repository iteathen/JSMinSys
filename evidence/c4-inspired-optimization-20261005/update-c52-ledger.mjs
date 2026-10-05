// C52 offline source-cost bookkeeping. Apply once per restored parent ledger.
import {readFileSync,writeFileSync} from 'node:fs';
const path='catalog/addon-cycle-ledger-v0.json',l=JSON.parse(readFileSync(path,'utf8')),
 source='addons/connect4-cpcx-pair-hub.mjs';
if(l.units.some(u=>u.source===source))throw Error('C52 ledger already applied');
const expr=ops=>ops.map(o=>`(${o.count})*`+(o.op==='runtime.call.subledger'?`CALL(${o.target})`:`C(${o.op})`)).join('+');
const op=(name,count,target)=>({op:name,count,...target?{target}:{}});
function unit(name,scope,operations,parameters,note){l.units.push({unit:source+'#'+name,source,name,scope,operations,
 cycleCount:{kind:'symbolic',expression:expr(operations),parameters,note},status:'decomposed'});}
unit('prepareConnect4CpcxPairHub32','cold-cpcx-plan',[
 op('runtime.typed_array.allocate',3),op('runtime.function.allocate',2),op('runtime.object.allocate',1),
 op('runtime.field.load','F'),op('runtime.field.store',4),op('runtime.number.multiply',3),
 op('memory.load.u32','6*P'),op('memory.store.native_index','4*P'),op('alu.add.u32','A'),
 op('alu.sub.u32','S'),op('alu.imul.u32','2*P'),op('control.test.u32','T'),op('control.branch','T')],
 {P:'tripleShapeStart-pairShapeStart, rule-only pair count.',F:'Cold geometry/native constructor/view byte-length reads.',A:'Initialization addresses/increments.',S:'Native extent/base/dimension subtraction.',T:'Integer dimension maximum, width selections and pair loop predicates.'},
 'Three arrays and two closures prepared before ready. Native width1/2/4 chosen once, no encode/decode or solved data. Per-worker pair table4*P*fieldBytes and scratch5*columns bytes; cold constructor lowering remains target qualification debt.');
unit('addSpoke','cpcx-pair-hot',[
 op('memory.load.u32','HEIGHT+FIRST'),op('memory.load.u8','COUNT'),op('memory.store.u8','WRITE_COUNT'),
 op('memory.store.u32','WRITE_FIRST'),op('alu.add.u32','ADD'),op('control.test.u32','TEST'),op('control.branch','BRANCH')],
 {HEIGHT:'0..2 height reads reached after forced-column guard.',FIRST:'First-completion-column read only after count is nonzero.',COUNT:'Count admission/zero tests.',WRITE_COUNT:'0 or1 saturated scratch update.',WRITE_FIRST:'1 only on first valid spoke for a trigger.',ADD:'Support/frame addresses and same-column lift.',TEST:'Actually reached short-circuit/height/count/duplicate predicates.',BRANCH:'Actually reached conditional branches.'},
 'Caller supplies exact legal support. Column dedup is physical completion dedup after the trigger. Uint32 firstColumn supports full native index domain; count0 guards stale entries. No allocation/counters/recursion.');
unit('findConnect4CpcxPairHub32','cpcx-pair-hot',[
 op('memory.load.u32','SOURCE+BASIS+HEIGHT'),op('memory.load.native_index','4*PAIRS'),op('memory.store.u8','RESET+FAIL'),
 op('alu.add.u32','ADD'),op('alu.sub.u32','SUB'),op('alu.and.u32','AND'),op('alu.xor.u32','BITS'),
 op('alu.shl.u32','SHL'),op('alu.shr.u32','SHR'),op('alu.clz.u32','BITS'),op('alu.imul.u32','PAIRS'),
 op('control.test.u32','TEST'),op('control.branch','BRANCH'),op('runtime.call.subledger','SPOKES','addSpoke'),
 op('runtime.call.subledger','CHECKS','connect4RbaExposesOpponentWin')],
 {SOURCE:'Active mover coordinate words loaded.',BASIS:'Early basis predicates and actual active slot IDs.',HEIGHT:'Candidate C05 height read.',PAIRS:'Active pair IDs actually reached before return.',RESET:'columns only when cardinality preguard passes.',FAIL:'Triggers failing C05, at most once each per call.',ADD:'Actual source/slot/plan/reset address and loop arithmetic.',SUB:'Extent, low-bit and plan-origin arithmetic.',AND:'Low-bit extraction and poisoned-tail mask.',BITS:'Active coordinate bits examined, including singleton skips/triple stopping.',SHL:'Word index base and tail operations.',SHR:'Coordinate span and tail mask.',TEST:'Reached early/cardinality/loop/candidate/guard predicates.',BRANCH:'Actual short-circuit/loop branches.',SPOKES:'At most2*PAIRS, shortened by positive first endpoint.',CHECKS:'Saturated unique trigger candidates passed to C05.'},
 'Captured geometry/native plans, reusable worker-local scratch. No allocation, reports, child preparation or generic prototype dispatcher. Actual register/bounds/native-access/inlining costs require optimized diagnostics and whole solve. Table index is direct native field, not packed identity.');
for(const u of l.units.filter(u=>u.source.includes('worker-minimal'))){
 const key=u.cycleCount.activeCycleExpression?'activeCycleExpression':'expression';
 if(u.name==='negamax'){
  u.operations.push(op('runtime.call.subledger','TACT','findConnect4CpcxPairHub32'),op('runtime.call.subledger','FORK_D','relativeToAbsolute'),
   op('runtime.call.subledger','FORK_D','storeExact'),op('control.test.u32','TACT+FORK'),op('control.branch','TACT+FORK'),op('runtime.field.store','FORK_ROOT'));
  Object.assign(u.cycleCount.parameters,{TACT:'1 only after stop/cache and C01 dual-threat-loss exits.',FORK:'1 only for a positive current-mover pair-hub certificate.',FORK_D:'FORK at non-root.',FORK_ROOT:'FORK at root; bestMove context slot publication.',
   R:'Ordinary nonterminal recursive children; none execute after C52 certificate return.'});
  u.cycleCount.note+=' C52current-mover WIN is current-rule proof, before CPC/order/child construction; all windows admit exact certified truth and root action. Existing q/hash/cache gauge unchanged.';
 }else if(u.name==='<module-main>'){
  u.operations.push(op('runtime.call.subledger',1,'prepareConnect4CpcxPairHub32'),op('runtime.field.load',1));
  u.cycleCount.note+=' C52pair profile and selected find method bound once before readiness; no per-node factory or plan allocation.';
 }else continue;
 u.cycleCount[key]=expr(u.operations);
}
writeFileSync(path,JSON.stringify(l,null,2)+'\n');
