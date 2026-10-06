// Cold accounting. Counts describe emitted operations, not measured machine cycles.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const path='catalog/addon-cycle-ledger-v0.json',l=JSON.parse(readFileSync(path,'utf8')),
 source='addons/rba-connect4-index-partial-cache.mjs';
const expr=ops=>ops.map(o=>o.op==='runtime.call.subledger'?`(${o.count})*CALL(${o.target})`:`(${o.count})*C(${o.op})`).join('+'),
 op=(name,count)=>({op:name,count}),call=(target,count=1)=>({op:'runtime.call.subledger',target,count});
l.units=l.units.filter(u=>u.source!==source&&!u.source.endsWith('-partial24.mjs'));
const specs={
 packIndexPartial24Support32:[op('memory.load.u32',9),op('alu.add.u32',8),op('alu.shl.u32',8),op('alu.or.u32',8),op('alu.and.u32',2),op('alu.shr.u32',1)],
 createIndexPartialCache32:[op('runtime.cold.tt.bank.initialize',1),call('isCompactLayoutProfile8'),call('validateConnect4CacheCapacity32'),call('attachIndexPartialCache32')],
 attachIndexPartialCache32:[op('runtime.cold.tt.bank.initialize',1),call('validateConnect4CacheCapacity32')],
 probeIndexPartial24Local32:[op('runtime.field.load',3),op('alu.and.u32',1),op('runtime.number.multiply',1),op('alu.add.u32',8),op('alu.shr.u32',1),op('memory.load.u32',9),op('control.test.u32',6),op('control.branch',6)],
 storeIndexPartial24Local32:[op('runtime.field.load',3),op('alu.and.u32',1),op('runtime.number.multiply',1),op('alu.add.u32',8),op('alu.shr.u32',1),op('memory.load.u32',3),op('memory.store.u32',6)],
 probeIndexPartial24Shared32:[op('runtime.field.load',3),op('alu.and.u32',4),op('runtime.number.multiply',1),op('alu.add.u32',8),op('alu.shr.u32',2),op('memory.load.u32',3),op('atomic.load.u32',7),op('control.test.u32',9),op('control.branch',9)],
 storeIndexPartial24Shared32:[op('runtime.field.load',3),op('alu.and.u32',2),op('runtime.number.multiply',1),op('alu.add.u32',10),op('alu.shr.u32',1),op('alu.shl.u32',1),op('alu.or.u32',1),op('memory.load.u32',3),op('atomic.load.u32',1),op('atomic.rmw.u32',1),op('atomic.store.u32',6),op('control.test.u32',2),op('control.branch',2)],
};
for(const [name,operations] of Object.entries(specs)){
 if(/^(probe|store)/.test(name))operations.push(call('packIndexPartial24Support32','DEFAULT'));
 l.units.push({unit:source+'#'+name,source,name,scope:'exact-index-partial-tt',status:'decomposed',operations,
  cycleCount:{kind:'symbolic',expression:expr(operations),parameters:{DEFAULT:'0 in prepared worker calls;1 when public diagnostic default is used'},
   note:'Native24byte nonterminal q identity. Full32bit seqlock preserved; partial hash proof packing and support/tail preparation explicitly charged. No runtime decoder/allocator/clock/stats. Counts are full-path upper bounds where short-circuit/CAS failure exits early; no timing claim from ledger.'}});
}
for(const center of [false,true])for(const proofs of [false,true]){
 const base='addons/rba-connect4-lazy-smp-worker-minimal-views-compiled'+(center?'-center':'')+(proofs?'-proofs':'')+'-local32.mjs',target=base.replace('.mjs','-partial24.mjs'),
  units=l.units.filter(u=>u.source===base&&!['localKeyMatches','storeLocalEntry'].includes(u.name));
 for(const original of units){
  const u=structuredClone(original);u.unit=target+'#'+u.name;u.source=target;
  u.operations=u.operations.filter(o=>!['compactSupportProfile8','compactTailProfile8','prepareSharedCacheAccess','attachConnect4RbaSharedExactCache32'].includes(o.target));
  for(const o of u.operations){
   if(o.target==='localKeyMatches'){o.target='probeIndexPartial24Local32';o.count=1;}
   if(o.target==='storeLocalEntry')o.target='storeIndexPartial24Local32';
   if(o.target==='sharedProbe')o.target='probeIndexPartial24Shared32';
   if(o.target==='sharedStore')o.target='storeIndexPartial24Shared32';
   if(o.target==='createLocalNativeProofCache32')o.target='createIndexPartialCache32';
   if(o.target==='attachConnect4RbaSharedLayoutCache32'){o.target='attachIndexPartialCache32';o.count=1;}
  }
  if(u.name==='negamax')u.operations.push(call('packIndexPartial24Support32','NONROOT'));
  u.cycleCount.expression=expr(u.operations);delete u.cycleCount.activeCycleExpression;
  u.cycleCount.note='Inherited retained search/tactical/cofactor/window/frontier costs. Native24 exact key consumers replace old key/store wrappers; one packed support replaces two prepared scalars. Conservative inherited arithmetic counts include unused slot/scalar plumbing until machine JIT removes it; final full solve pays actual emitted cost. Cold-selected candidate only, no hot profile/layout/reporting/allocation. Original search guards unchanged.';
  l.units.push(u);
 }
}
for(const u of l.units.filter(u=>u.source==='addons/rba-connect4-prepared-session-host.mjs'&&u.name==='prepareLazySmpConnect4Rba32')){
 u.operations=u.operations.filter(o=>o.target!=='createIndexPartialCache32');
 u.operations.push(call('createIndexPartialCache32','PARTIAL'));
 u.cycleCount.parameters.PARTIAL='1 only for explicitly selected partial24 on compact7x6;0 for unchanged generic/default layouts';
 u.cycleCount.expression=expr(u.operations);
 u.cycleCount.note+=' Partial identity admission/layout/worker selection is cold; allocations/page warming precede READY. Candidate factory replaces the original selected cache factory.';
}
for(const s of new Set(l.units.filter(u=>u.status==='decomposed').map(u=>u.source))){
 const bytes=readFileSync(s,'utf8').replaceAll('\r\n','\n');l.decomposedSourceBlobs[s]=createHash('sha1').update(`blob ${Buffer.byteLength(bytes)}\0`).update(bytes).digest('hex');
}
l.summary.units=l.units.length;l.summary.decomposed=l.units.filter(u=>u.status==='decomposed').length;
writeFileSync(path,JSON.stringify(l,null,2)+'\n');
