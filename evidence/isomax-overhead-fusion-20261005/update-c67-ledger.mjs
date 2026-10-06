// Offline C67 factory/context accounting. Context references are not assumed free.
import {readFileSync,writeFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const path='catalog/addon-cycle-ledger-v0.json',l=JSON.parse(readFileSync(path)),src='addons/rba-connect4-coordinate-compiled-transition-bound.mjs',
 expr=ops=>ops.map(o=>`(${o.count})*`+(o.op==='runtime.call.subledger'?`CALL(${o.target})`:o.op==='runtime.callback'?`CALLBACK(${o.target})`:`C(${o.op})`)).join('+'),op=(op,count,target)=>({op,count,...target?{target}:{}});
if(l.units.some(u=>u.source===src))throw Error('C67 already applied');
l.localOperationExtensions['runtime.context.load']={cost:{kind:'symbolic',name:'CONTEXT_LOAD_COST(capture,representation,lowering)'},note:'Captured immutable lexical value/reference read. Optimizer may retain/register-fold it or load a context slot; not zero or a fixed Intel latency. Actual JIT/whole-solve qualification required.'};
l.summary.localExtensionOperations=Object.keys(l.localOperationExtensions).length;
for(const span of ['Span','3'])for(const nw of [false,true]){
 const name='connect4RbaCompiledTransition'+span+'Cofactor'+(nw?'NonWinning':'')+'KnownHeight',factory='prepare'+name[0].toUpperCase()+name.slice(1),loader='loadBoundCompiled'+span+(nw?'NonWinning':'')+'Child32';
 const bound=structuredClone(l.units.find(u=>u.name===name));bound.source=src;bound.name=name+'Bound';bound.unit=src+'#'+bound.name;
 bound.operations=bound.operations.filter(o=>o.op!=='runtime.field.load');
 for(const o of bound.operations)if(o.target==='loadSupportCompiledChild32')o.target=loader;
 bound.operations.push(op('runtime.context.load','CTX'));bound.cycleCount.parameters.CTX='Actual captured numeric/pointer references read, including loop-dependent references. Register/constant folding never assumed free; no geometry/plan object dereference in body.';
 bound.cycleCount.expression=expr(bound.operations);bound.cycleCount.note+=' C67initialization captures; g/profile ABIarguments ignored under explicit bound-geometry contract. Childloader uses only output+knownhandle. Same array buffers/native widths/guards/semantics. No eval or literal board fork.';l.units.push(bound);
 l.units.push({unit:src+'#'+factory,source:src,name:factory,scope:'cold-compiled-binding',status:'decomposed',operations:[op('runtime.field.load','F'),op('control.test.u32','TEST'),op('control.branch','TEST'),op('runtime.error.throw','ERR'),op('runtime.function.allocate',2)],cycleCount:{kind:'symbolic',expression:'(F)*C(runtime.field.load)+(TEST)*C(control.test.u32)+(TEST)*C(control.branch)+(ERR)*C(runtime.error.throw)+(2)*C(runtime.function.allocate)',parameters:{F:'Actual reached plan/guard and13 numeric/array captures.',TEST:'Admission/optional-property predicates.',ERR:'1if planes missing;0proper hostselectedgeometry.'},note:'Two closures (loader/kernel) allocated once before ready; existing typed plans reused, no new table or board-specific source. Captured heap/context allocation/GC costs included in function operation, unqualified by source counts.'}});
 const ops=[op('runtime.context.load',1),op('memory.store.u32',1),op('memory.load.native_index',1)];l.units.push({unit:src+'#'+loader,source:src,name:loader,scope:'bound-child-size',status:'decomposed',operations:ops,cycleCount:{kind:'symbolic',expression:expr(ops),parameters:{NATIVE_WIDTHS:'SIZES1/2/4 cold by maxBasis.'},note:'Known child handle/output only; no g/plan/basis/inverse reads or scan.'}});
}
for(const u of l.units.filter(u=>u.source.includes('worker-minimal-views-compiled'))){
 if(u.name==='negamax')for(const o of u.operations)if(o.target?.startsWith('connect4RbaCompiledTransition'))o.target+='Bound';
 if(u.name==='<module-main>'){
  u.operations.push(op('runtime.call.subledger','THREE','prepareConnect4RbaCompiledTransition3CofactorNonWinningKnownHeight'),op('runtime.call.subledger','1-THREE','prepareConnect4RbaCompiledTransitionSpanCofactorNonWinningKnownHeight'));
  u.cycleCount.parameters.THREE='1when actual geometry coordWords3;0otherwise, one factory before ready.';
 }
 const key=u.cycleCount.activeCycleExpression?'activeCycleExpression':'expression';u.cycleCount[key]=expr(u.operations);u.cycleCount.note+=' C67only initialization chooses bound kernel; no recurring factory/select/flag, all C66tables/settings/cache and proof flow preserved.';
}
for(const s of new Set([src,...l.units.filter(u=>u.source.includes('worker-minimal-views-compiled')).map(u=>u.source)])){
 const b=Buffer.from(readFileSync(s,'utf8').replaceAll('\r\n','\n'));l.decomposedSourceBlobs[s]=createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
}
l.summary.units=l.units.length;writeFileSync(path,JSON.stringify(l,null,2)+'\n');
