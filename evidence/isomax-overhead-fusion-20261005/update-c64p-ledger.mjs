// Offline symbolic accounting for cold rank preparation and constant-time query.
import {readFileSync,writeFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const path='catalog/addon-cycle-ledger-v0.json',l=JSON.parse(readFileSync(path)),source='addons/rba-connect4-support-rank-query.mjs',
 expr=ops=>ops.map(o=>`(${o.count})*`+(o.op==='runtime.call.subledger'?`CALL(${o.target})`:o.op==='runtime.callback'?`CALLBACK(${o.target})`:`C(${o.op})`)).join('+'),op=(op,count,target)=>({op,count,...target?{target}:{}});
if(l.units.some(u=>u.source===source))throw Error('C64P already applied');
for(const [name,ops,parameters,note] of [
 ['prepareSupportRankQuery32',[op('runtime.integer.check','VALIDATE'),op('control.test.u32','TEST'),op('control.branch','BRANCH'),op('runtime.error.throw','ERR'),
  op('runtime.field.load','F'),op('runtime.field.store','FIELDS'),op('runtime.object.allocate','ADMIT'),op('runtime.object.freeze','ADMIT'),op('memory.allocate.shared.bytes','2*ADMIT'),op('runtime.typed_view.construct','2*ADMIT'),
  op('runtime.number.multiply','MUL'),op('alu.add.u32','ADD'),op('alu.shr.u32','N'),op('alu.shl.u32','N'),op('alu.and.u32','N'),op('alu.or.u32','N'),
  op('memory.load.u32','N+P*WORDS'),op('memory.store.u32','N'),op('memory.load.native_index','N+P'),op('memory.store.native_index','P*WORDS'),op('runtime.call.subledger','P*WORDS','popcount32')],
  {ADMIT:'1budget/profile admits arrays;0null fallback. No allocation before checks.',VALIDATE:'Actually reached integer/safe checks, before allocation.',TEST:'Reached validation,width/admission/row/ID/word predicates.',BRANCH:'Actually reached branches and loops.',ERR:'1on invalid budget.',F:'Actual cold geometry/plan/array field reads.',FIELDS:'Metadata+spread field publications (reuse existing arrays, no deep copy).',MUL:'Reached size/byte/row scalar multiplies.',ADD:'Reached scalar sums/address/loop increments/count increments.',N:'Sum of actual support basis sizes over all profiles;0notadmitted.',P:'Admitted profiles;0notadmitted.',WORDS:'geometry shapeWordCount.',NATIVE_WIDTHS:'basis IDs1/2/4 from shapeCount; sizes/prefix1/2/4 from maxBasis, selected before loops.'},
  'Geometry-only cold immutable rows. Membership construction uses one ID read and one mask read/write per row member. Prefix native store and full-word popcount per shape word. Additional byte spans and conservative working peak budget are explicit. No owners, outcomes, labels or position-specific heuristic.' ],
 ['findSupportRankSlot32',[op('alu.add.u32',2),op('alu.shr.u32',1),op('alu.and.u32',2),op('alu.shl.u32',1),op('alu.not.u32',1),op('memory.load.u32',1),op('memory.load.native_index',1),op('alu.sub.u32',1),op('alu.shr.u32',4),op('alu.and.u32',4),op('alu.add.u32',2),op('alu.imul.u32',1)],
  {NATIVE_WIDTHS:'prefix chosen1/2/4cold; current7x6Uint8. Membershipuint32. Full member precondition inherited from exact cofactor.'},
  'HOT fixed-cost rank in exact sorted child support basis. Native prefix and membership loads; sealed popcount body mechanically expanded by checked generator and charged directly here. No nested hot call, floating mask subtraction, looping/alloc/selector or reporting. Initializer still invokes sealed popcount outside search. JIT/guards/register/cache locality measured rather than assumed.' ],
])l.units.push({unit:source+'#'+name,source,name,scope:'support-rank-query',status:'decomposed',operations:ops,cycleCount:{kind:'symbolic',expression:expr(ops),parameters,note}});
for(const old of [...l.units].filter(u=>/coordinate-closure-search-view-(dense|prepared)\.mjs$/.test(u.source))){
 const u=structuredClone(old);u.source=u.source.replace('closure-search-view-','closure-rank-view-');u.name=u.name.replace('ClosureSearchView','ClosureRankView');u.unit=u.source+'#'+u.name;
 for(const o of u.operations){if(o.target==='findSupportBasisSlot32')o.target='findSupportRankSlot32';if(o.op==='runtime.field.load'&&o.count==='3*K')o.count='5*K';}
 u.cycleCount.expression=expr(u.operations);u.cycleCount.note+=' C64Ptwo prepared shared rank-array pointers, rowwordbase from known childhandle. Replaces binary query with sealed popcount/native prefix; existing child loader and all proof/owner/closure guards unchanged.';l.units.push(u);
}
for(const old of [...l.units].filter(u=>u.source.includes('worker-minimal-views')&&!u.source.includes('views-rank'))){
 const u=structuredClone(old);u.source=u.source.replace('-views','-views-rank');u.unit=u.source+'#'+u.name;
 for(const o of u.operations){if(o.target==='prepareSupportBasisViewScratch32')o.target='prepareSupportSearchBasisScratch32';if(o.target?.includes('connect4RbaClosureHandleView'))o.target=o.target.replace('ClosureHandleView','ClosureRankView');}
 const key=u.cycleCount.activeCycleExpression?'activeCycleExpression':'expression';u.cycleCount[key]=expr(u.operations);u.cycleCount.note+=' C64Pcomplete rank arrays selected by host before spawn, no per-node test; inverse scratch omitted, null ABIargument, Fsymbol counts remaining actual fields.';l.units.push(u);
}
for(const u of l.units.filter(u=>u.source==='addons/rba-connect4-prepared-session-host.mjs')){
 if(u.name==='prepareLazySmpConnect4Rba32'){
  u.operations.push(op('runtime.call.subledger','BV','prepareSupportRankQuery32'),op('runtime.object.allocate','RANK'),op('runtime.field.load','RANK_FIELDS'),op('runtime.field.store','RANK_FIELDS'),op('control.test.u32','RANK_TEST'),op('control.branch','RANK_TEST'),op('runtime.string.concat','workers*RANK'));
  u.cycleCount.parameters.BV='1when fullclosure/reflection view admitted;0otherwise. Rank preparation occurs entirely before ready.';u.cycleCount.parameters.RANK='1when rank budget admitted;0old B2fallback.';u.cycleCount.parameters.RANK_FIELDS='Actually reached rankplan/geometry metadata field reads/publications, including geometry spread; no buffer copying.';u.cycleCount.parameters.RANK_TEST='Cold preparation/result and worker-path selections.';
  if(!u.operations.some(o=>o.target==='prepareSupportBasisPlans32')){u.operations.push(op('runtime.call.subledger','PLAN','prepareSupportBasisPlans32'));u.cycleCount.parameters.PLAN='1when positive support budget and not already aborted. Audit correction: existing cold compiler call explicitly charged, previously absent here.';}
 }else if(['preparedConnect4SearchState32','materializePreparedConnect4SearchResult32'].includes(u.name)){
  u.operations.push(op('runtime.field.load',2),op('runtime.field.store',2),op('control.test.u32',2),op('control.branch',2));
 }
 const key=u.cycleCount.activeCycleExpression?'activeCycleExpression':'expression';u.cycleCount[key]=expr(u.operations);u.cycleCount.note+=' C64Ponly cold rank preparation/selection/reporting added; result rankQuery and exact byte cost exposed. No hot statistics or solver policy change.';
}
for(const s of new Set([source,'addons/rba-connect4-prepared-session-host.mjs',...l.units.filter(u=>u.source.includes('closure-rank-view')||u.source.includes('worker-minimal-views-rank')).map(u=>u.source)])){
 const b=Buffer.from(readFileSync(s,'utf8').replaceAll('\r\n','\n'));l.decomposedSourceBlobs[s]=createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
}
l.summary.units=l.units.length;writeFileSync(path,JSON.stringify(l,null,2)+'\n');
