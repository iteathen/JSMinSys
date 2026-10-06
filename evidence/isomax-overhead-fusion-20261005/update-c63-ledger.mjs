// Offline cost/source accounting; never loaded by a solver.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const path='catalog/addon-cycle-ledger-v0.json',l=JSON.parse(readFileSync(path)),
 expr=ops=>ops.map(o=>`(${o.count})*`+(o.op==='runtime.call.subledger'?`CALL(${o.target})`:o.op==='runtime.callback'?`CALLBACK(${o.target})`:`C(${o.op})`)).join('+'),
 op=(op,count,target)=>({op,count,...target?{target}:{}});
if(l.units.some(u=>u.source.includes('support-handle-view')))throw Error('C63already applied');
const helper='addons/rba-connect4-support-handle-view.mjs',init=structuredClone(l.units.find(u=>u.name==='initializeSupportBasisView32'));
init.source=helper;init.name='initializeSupportBasisHandle32';init.unit=helper+'#'+init.name;init.cycleCount.note+=' C63same root validation/row comparison, return support handle; row offset constructed by consumer. No basis-dependent divide, including zero-line geometry.';l.units.push(init);
const load={unit:helper+'#loadSupportBasisKnownHandle32',source:helper,name:'loadSupportBasisKnownHandle32',scope:'known-support-view-loader',status:'decomposed',
 operations:[op('runtime.field.load','F'),op('memory.load.native_index','1+N'),op('memory.store.u32','N+1'),op('runtime.number.multiply',1),op('alu.add.u32','2*N'),op('control.test.u32','N+1'),op('control.branch','N+1')],
 cycleCount:{kind:'symbolic',parameters:{F:'Actually reached plan/geometry/array fields.',N:'Current support basis size. Native IDs read once, inverse written once; no target heights or basis writes.',NATIVE_WIDTHS:'One sizes read width maxBasis<=255/65535=>1/2/4; Nbasis reads shapeCount<=256/65536=>1/2/4, chosen cold. Inverse/outputhandle storesuint32.'},note:'C63complete legal handle precondition. No per-node validation or height/stride scan. Extra parent increment is charged in the calling cofactor.'}};
load.cycleCount.expression=expr(load.operations);l.units.push(load);
for(const old of [...l.units].filter(u=>/coordinate-closure-view-(dense|prepared)\.mjs$/.test(u.source))){
 const u=structuredClone(old);u.source=u.source.replace('closure-view-','closure-handle-view-');u.name=u.name.replace('ClosureView','ClosureHandleView');u.unit=u.source+'#'+u.name;
 for(const o of u.operations)if(o.target==='loadSupportClosureBasisView32')o.target='loadSupportBasisKnownHandle32';
 u.operations.push(op('runtime.field.load','2*K'),op('memory.load.u32','K'),op('alu.add.u32','K'));
 u.cycleCount.parameters.K='Nonterminal construction path:1when loader reached;0on firstwin/fullboard terminal. Known parent + one nativeuint32 column stride; no support reconstruction.';
 u.cycleCount.expression=expr(u.operations);u.cycleCount.note+=' C63generated from exactview authority; appended parent handle supplies raw child index by one stride. Same inverse/closure/owner/firstterminal order. Native basis widths remain explicit.';l.units.push(u);
}
for(const u of l.units.filter(u=>u.source.includes('worker-minimal-views'))){
 if(u.name==='negamax'){
  for(const o of u.operations){if(o.target?.includes('connect4RbaClosureView'))o.target=o.target.replace('ClosureView','ClosureHandleView');if(o.op==='runtime.number.multiply'&&o.count==='R')o.count='SELF';}
  u.cycleCount.parameters.SELF='One rowbase multiplication on each admitted node entry after stop gate; same recursive scalar slot carries canonical supporthandle, no extra frame or parameter.';
  u.cycleCount.parameters.R='Nonterminal child recursions/frontier updates; canonical handle forwarded without repeating mirror or row construction in caller.';
 }
 if(u.name==='<module-main>'){
  for(const o of u.operations){if(o.target==='initializeSupportBasisView32')o.target='initializeSupportBasisHandle32';if(o.target==='initializeResidualProof3')o.target='childResidualProof3';if(o.target==='initializeResidualProof32')o.target='childResidualProof32';}
  u.operations.push(op('runtime.number.multiply',1));
  u.cycleCount.note+=' C63root validation returns knownhandle; frontier child(handle,0,0) establishes same root frame without second height scan. One rootBi multiplication for immediate-win ingress; no extra allocation/pointer.';
 }
 const k=u.cycleCount.activeCycleExpression?'activeCycleExpression':'expression';u.cycleCount[k]=expr(u.operations);
}
for(const source of new Set(l.units.filter(u=>u.source===helper||u.source.includes('closure-handle-view')||u.source.includes('worker-minimal-views')).map(u=>u.source))){
 const b=Buffer.from(readFileSync(source,'utf8').replaceAll('\r\n','\n'));l.decomposedSourceBlobs[source]=createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
}
l.summary.units=l.units.length;writeFileSync(path,JSON.stringify(l,null,2)+'\n');
