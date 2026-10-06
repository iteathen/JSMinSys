// Cold accounting. Counts describe emitted operations, not measured machine cycles.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const path='catalog/addon-cycle-ledger-v0.json',l=JSON.parse(readFileSync(path,'utf8')),
 source='addons/rba-connect4-index-partial-cache.mjs';
const expr=ops=>ops.map(o=>o.op==='runtime.call.subledger'?`(${o.count})*CALL(${o.target})`:`(${o.count})*C(${o.op})`).join('+'),
 op=(name,count)=>({op:name,count}),call=(target,count=1)=>({op:'runtime.call.subledger',target,count});
l.units=l.units.filter(u=>u.source!==source&&!/-partial(?:24|16|Mixed)\.mjs$/.test(u.source));
const specs={
 packIndexPartial24Support32:[op('memory.load.u32',9),op('alu.add.u32',8),op('alu.shl.u32',8),op('alu.or.u32',8),op('alu.and.u32',2),op('alu.shr.u32',1)],
 createIndexPartialCache32:[op('runtime.cold.tt.bank.initialize',1),call('isCompactLayoutProfile8'),call('validateConnect4CacheCapacity32'),call('attachIndexPartialCache32')],
 attachIndexPartialCache32:[op('runtime.cold.tt.bank.initialize',1),call('validateConnect4CacheCapacity32')],
 probeIndexPartial24Local32:[op('runtime.field.load',3),op('alu.and.u32',1),op('runtime.number.multiply',1),op('alu.add.u32',8),op('alu.shr.u32',1),op('memory.load.u32',9),op('control.test.u32',6),op('control.branch',6)],
 storeIndexPartial24Local32:[op('runtime.field.load',3),op('alu.and.u32',1),op('runtime.number.multiply',1),op('alu.add.u32',8),op('alu.shr.u32',1),op('memory.load.u32',3),op('memory.store.u32',6)],
 probeIndexPartial24Shared32:[op('runtime.field.load',3),op('alu.and.u32',4),op('runtime.number.multiply',1),op('alu.add.u32',8),op('alu.shr.u32',2),op('memory.load.u32',3),op('atomic.load.u32',7),op('control.test.u32',9),op('control.branch',9)],
 storeIndexPartial24Shared32:[op('runtime.field.load',3),op('alu.and.u32',2),op('runtime.number.multiply',1),op('alu.add.u32',10),op('alu.shr.u32',1),op('alu.shl.u32',1),op('alu.or.u32',1),op('memory.load.u32',3),op('atomic.load.u32',1),op('atomic.rmw.u32',1),op('atomic.store.u32',6),op('control.test.u32',2),op('control.branch',2)],
};
specs.packIndexPartial16Heights32=[op('memory.load.u32',7),op('alu.add.u32',6),op('alu.shl.u32',6),op('alu.or.u32',6),op('alu.shr.u32',1)];
specs.packIndexPartial16Support32=[op('memory.load.u32',4),op('alu.add.u32',4),op('alu.or.u32',3),op('control.test.u32',1),op('control.branch',1),call('packIndexPartial16Heights32','ELIGIBLE')];
for(const side of ['Local','Shared'])for(const action of ['probe','store']){
 const name=action+'IndexPartial16'+side+'32',ops=structuredClone(specs[action+'IndexPartial24'+side+'32']);
 for(const o of ops){
  if(o.op==='memory.load.u32')o.count-=side==='Local'&&action==='probe'?4:2;
  if(o.op==='memory.store.u32')o.count-=2;
  if(o.op==='atomic.load.u32'&&action==='probe')o.count-=2;
  if(o.op==='atomic.store.u32')o.count-=2;
  if(o.op==='alu.add.u32')o.count-=4;
 }
 ops.push(op('control.test.u32',1),op('control.branch',1));specs[name]=ops;
}
specs.createMixedIndexPartialCache32=[op('runtime.cold.tt.bank.initialize',1),call('createIndexPartialCache32',2),call('attachMixedIndexPartialCache32')];
specs.attachMixedIndexPartialCache32=[op('runtime.cold.tt.bank.initialize',1),call('attachIndexPartialCache32',2)];
for(const side of ['Local','Shared'])for(const action of ['probe','store'])specs[action+'IndexPartialMixed'+side+'32']=[
 op('runtime.field.load',1),op('control.test.u32',1),op('control.branch',1),op('alu.and.u32','WIDE'),
 call(action+'IndexPartial16'+side+'32','1-WIDE'),call(action+'IndexPartial24'+side+'32','WIDE')];
for(const [name,operations] of Object.entries(specs)){
 if(/^(probe|store)/.test(name)&&!name.includes('Mixed'))operations.push(call(name.includes('16')?'packIndexPartial16Support32':'packIndexPartial24Support32','DEFAULT'));
 l.units.push({unit:source+'#'+name,source,name,scope:'exact-index-partial-tt',status:'decomposed',operations,
  cycleCount:{kind:'symbolic',expression:expr(operations),parameters:{DEFAULT:'0 in prepared worker calls;1 when public diagnostic default is used',ELIGIBLE:'1 if checked narrow-domain tail test passes;0 otherwise',WIDE:'1 for support-dependent wide class;0 for narrow'},
   note:'Native24/16byte nonterminal q identities. Full32bit seqlock preserved; partial hash proof packing, support/tail preparation and narrow admission guard charged. No runtime decoder/allocator/clock/stats. Counts are full-path upper bounds where short-circuit/CAS/admission failure exits early; no timing claim from ledger.'}});
}
for(const kind of ['partial24','partial16','partialMixed'])for(const center of [false,true])for(const proofs of [false,true]){
 const base='addons/rba-connect4-lazy-smp-worker-minimal-views-compiled'+(center?'-center':'')+(proofs?'-proofs':'')+'-local32.mjs',target=base.replace('.mjs','-'+kind+'.mjs'),
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
  if(u.name==='negamax'){
   u.operations.push(call(kind==='partial16'?'packIndexPartial16Heights32':'packIndexPartial24Support32',kind==='partialMixed'?'NONROOT*WIDE':'NONROOT'));
   if(kind==='partial16')u.operations.push(op('control.test.u32',1),op('control.branch',1));
   if(kind==='partialMixed')u.operations.push(call('packIndexPartial16Heights32','NONROOT*(1-WIDE)'),op('control.test.u32',1),op('control.branch',1),op('alu.or.u32','NONROOT*WIDE'));
  }
  if(kind==='partial16')for(const o of u.operations)if(o.target?.includes('IndexPartial24'))o.target=o.target.replace('IndexPartial24','IndexPartial16');
  if(kind==='partialMixed')for(const o of u.operations){
   if(o.target?.includes('IndexPartial24'))o.target=o.target.replace('IndexPartial24','IndexPartialMixed');
   if(o.target==='attachIndexPartialCache32')o.target='attachMixedIndexPartialCache32';
   if(o.target==='createIndexPartialCache32')o.target='createMixedIndexPartialCache32';
  }
  if(kind==='partialMixed')u.cycleCount.parameters.WIDE='1 when basis count>32;0 otherwise, support-only deterministic class';
  u.cycleCount.expression=expr(u.operations);delete u.cycleCount.activeCycleExpression;
  u.cycleCount.note='Inherited retained search/tactical/cofactor/window/frontier costs. Native24 exact key consumers replace old key/store wrappers; one packed support replaces two prepared scalars. Conservative inherited arithmetic counts include unused slot/scalar plumbing until machine JIT removes it; final full solve pays actual emitted cost. Cold-selected candidate only, no hot profile/layout/reporting/allocation. Original search guards unchanged.';
  l.units.push(u);
 }
}
for(const u of l.units.filter(u=>u.source==='addons/rba-connect4-prepared-session-host.mjs'&&u.name==='prepareLazySmpConnect4Rba32')){
 u.operations=u.operations.filter(o=>!['createIndexPartialCache32','createMixedIndexPartialCache32'].includes(o.target));
 u.operations.push(call('createIndexPartialCache32','PARTIAL*(1-MIXED)'),call('createMixedIndexPartialCache32','PARTIAL*MIXED'));
 u.cycleCount.parameters.PARTIAL='1 only for explicitly selected partial24 on compact7x6;0 for unchanged generic/default layouts';
 u.cycleCount.parameters.MIXED='1 only for predeclared mixed16/24 current-rank pool;0 otherwise';
 u.cycleCount.expression=expr(u.operations);
 u.cycleCount.note+=' Partial identity admission/layout/worker selection is cold; allocations/page warming precede READY. Candidate factory replaces the original selected cache factory.';
}
for(const s of new Set(l.units.filter(u=>u.status==='decomposed').map(u=>u.source))){
 const bytes=readFileSync(s,'utf8').replaceAll('\r\n','\n');l.decomposedSourceBlobs[s]=createHash('sha1').update(`blob ${Buffer.byteLength(bytes)}\0`).update(bytes).digest('hex');
}
l.summary.units=l.units.length;l.summary.decomposed=l.units.filter(u=>u.status==='decomposed').length;
writeFileSync(path,JSON.stringify(l,null,2)+'\n');
