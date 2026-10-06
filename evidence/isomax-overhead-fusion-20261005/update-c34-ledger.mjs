// Offline C34 accounting. Original libraries remain unchanged.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const path='catalog/addon-cycle-ledger-v0.json',l=JSON.parse(readFileSync(path)),source='addons/rba-connect4-prepared-compact-cache.mjs';
if(l.units.some(u=>u.source===source))throw Error('C34 already applied');
const names={localNativeProofKeyMatches32:'localPreparedCompactKeyMatches32',storeLocalNativeProofEntry32:'storeLocalPreparedCompactEntry32',probeCompactSharedCache32:'probeSharedPreparedCompact32',storeCompactSharedCache32:'storeSharedPreparedCompact32'},
 expr=ops=>ops.map(o=>`(${o.count})*`+(o.op==='runtime.call.subledger'?`CALL(${o.target})`:o.op==='runtime.callback'?`CALLBACK(${o.target})`:`C(${o.op})`)).join('+');
for(const [old,name] of Object.entries(names)){
 const u=structuredClone(l.units.find(u=>u.name===old));u.source=source;u.name=name;u.unit=source+'#'+name;
 u.operations=u.operations.filter(o=>!['compactSupportProfile8','compactTailProfile8','compactLayoutSupportProfile8','compactLayoutTailProfile8'].includes(o.target));
 u.cycleCount.expression=expr(u.operations);u.cycleCount.note+=' C34: support/tail scalar formation removed here and charged eagerly at worker node entry. Same reached raw heights/coordinates, short-circuit fields, exact tags, full uint32 seqlock/CAS/version wrap/drop protocol. Additional arguments/live-register/call lowering remain machine-cost debt, not free.';
 l.units.push(u);
}
for(const u of l.units.filter(u=>u.source.includes('worker-minimal-views')&&u.source.endsWith('-local32.mjs'))){
 for(const o of u.operations)if(names[o.target])o.target=names[o.target];
 if(u.name==='negamax'){
  u.operations.push({op:'runtime.call.subledger',count:'NONROOT',target:'compactSupportProfile8'},{op:'runtime.call.subledger',count:'NONROOT',target:'compactTailProfile8'},
   {op:'control.test.u32',count:2},{op:'control.branch',count:2});
  u.cycleCount.parameters.NONROOT='1 at each entered nonroot after stop gate, including empty cache/early proof path;0 root. Both eager packed scalars remain live across recursion.';
 }
 if(u.name==='<module-main>')for(const o of u.operations)if(o.op==='runtime.field.load'&&o.count==='3+2*NATIVE')o.count=3;
 const key=u.cycleCount.activeCycleExpression?'activeCycleExpression':'expression';u.cycleCount[key]=expr(u.operations);
 u.cycleCount.note+=' C34: two prepared scalars forwarded through existing wrappers. No identity array/allocator/hot selector; scalar arguments, spill/call/inlining cost remains included in target measurement. Cold aliases select only prepared compact accessors; cold attach and proof-domain validation retained.';
}
l.isomaxSystemCycleGraph.callbackTargets.sharedProbe.push(source+'#probeSharedPreparedCompact32');
l.isomaxSystemCycleGraph.callbackTargets.sharedStore.push(source+'#storeSharedPreparedCompact32');
for(const s of new Set([source,...l.units.filter(u=>u.source.includes('worker-minimal-views')&&u.source.endsWith('-local32.mjs')).map(u=>u.source)])){
 const b=Buffer.from(readFileSync(s,'utf8').replaceAll('\r\n','\n'));l.decomposedSourceBlobs[s]=createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
}
l.summary.units=l.units.length;writeFileSync(path,JSON.stringify(l,null,2)+'\n');
