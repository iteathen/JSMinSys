// Offline accounting: sorted rank query replaces eager inverse preparation.
import {readFileSync,writeFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const path='catalog/addon-cycle-ledger-v0.json',l=JSON.parse(readFileSync(path)),source='addons/rba-connect4-support-search-view.mjs',
 expr=ops=>ops.map(o=>`(${o.count})*`+(o.op==='runtime.call.subledger'?`CALL(${o.target})`:o.op==='runtime.callback'?`CALLBACK(${o.target})`:`C(${o.op})`)).join('+'),op=(op,count,target)=>({op,count,...target?{target}:{}});
if(l.units.some(u=>u.source===source))throw Error('C64 already applied');
const scratch=structuredClone(l.units.find(u=>u.name==='prepareSupportBasisViewScratch32'));
scratch.source=source;scratch.name='prepareSupportSearchBasisScratch32';scratch.unit=source+'#'+scratch.name;
scratch.operations=[op('runtime.field.load',1),op('runtime.typed_array.allocate',2),op('runtime.object.allocate',1),op('runtime.field.store',2)];scratch.cycleCount.expression=expr(scratch.operations);scratch.cycleCount.note='COLD map1 + mirror(keyWords). No shapeCount inverse allocation. Bytes4+4*keyWords; no additional cold tables.';l.units.push(scratch);
for(const [name,ops,parameters,note] of [
 ['loadSupportSearchBasisKnownHandle32',[op('memory.store.u32',1),op('runtime.field.load',2),op('memory.load.native_index',1)],{NATIVE_WIDTHS:'sizes: maxBasis<=255/65535=>1/2/4 chosen cold.'},'Known legal child handle; unused heights/basis/inverse never touched. No row scan or multiply.'],
 ['findSupportBasisSlot32',[op('memory.load.native_index','K'),op('alu.add.u32','2*K+LOW'),op('alu.shr.u32','K'),op('control.test.u32','2*K+1'),op('control.branch','2*K+1')],{K:'Actual lower-bound search iterations,0on empty. Called only for a proved member of exact sorted row.',LOW:'Iterations taking lower half update mid+1;0..K.',NATIVE_WIDTHS:'ID width shapeCount<=256/65536=>1/2/4. Same immutable native array; no decoder/flags.'},'Small pure lower-bound query. Argument/register/call/guard/inlining cost remains target debt; no array allocation or reporting.'],
])l.units.push({unit:source+'#'+name,source,name,scope:'support-row-rank',status:'decomposed',operations:ops,cycleCount:{kind:'symbolic',expression:expr(ops),parameters,note}});
for(const old of [...l.units].filter(u=>/coordinate-closure-handle-view-(dense|prepared)\.mjs$/.test(u.source))){
 const u=structuredClone(old);u.source=u.source.replace('closure-handle-view-','closure-search-view-');u.name=u.name.replace('ClosureHandleView','ClosureSearchView');u.unit=u.source+'#'+u.name;
 for(const o of u.operations)if(o.target==='loadSupportBasisKnownHandle32')o.target='loadSupportSearchBasisKnownHandle32';
 u.cycleCount.parameters.Q='0: inverse typed load removed; rank helper charges its own native ID accesses.';
 u.cycleCount.parameters.I='0: image lower-bound loop is wholly in findSupportBasisSlot32 subledger; no duplicate loop charge here.';
 u.operations.push(op('runtime.call.subledger','J','findSupportBasisSlot32'),op('runtime.field.load','3*K'),op('memory.load.u32','K'),op('runtime.number.multiply','K'));
 u.cycleCount.expression=expr(u.operations);u.cycleCount.note+=' C64 replaces eager child inverse/map slot read with sorted row lower-bound for surviving images only. Added child-row native pointer/base setup charged on nonterminal Kpath. Existing active/owner/absorption/closure/terminal guards identical. No atomic or hot selector.';l.units.push(u);
}
for(const u of l.units.filter(u=>u.source.includes('worker-minimal-views'))){
 for(const o of u.operations){if(o.target==='prepareSupportBasisViewScratch32')o.target='prepareSupportSearchBasisScratch32';if(o.target?.includes('connect4RbaClosureHandleView'))o.target=o.target.replace('ClosureHandleView','ClosureSearchView');}
 const key=u.cycleCount.activeCycleExpression?'activeCycleExpression':'expression';u.cycleCount[key]=expr(u.operations);u.cycleCount.note+=' C64: module binds map+mirror scratch and search cofactor once. Recursive cofactor no longer loads coord.inverse; Fcounts actual remaining fields and null argument/frame lowering remains machine debt. Other C63/C34 work unchanged.';
}
for(const s of new Set([source,...l.units.filter(u=>u.source.includes('closure-search-view')||u.source.includes('worker-minimal-views')).map(u=>u.source)])){
 const b=Buffer.from(readFileSync(s,'utf8').replaceAll('\r\n','\n'));l.decomposedSourceBlobs[s]=createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
}
l.summary.units=l.units.length;writeFileSync(path,JSON.stringify(l,null,2)+'\n');
