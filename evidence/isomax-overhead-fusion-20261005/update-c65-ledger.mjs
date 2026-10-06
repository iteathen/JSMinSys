// Offline repeated phase-extraction removal, not runtime diagnostics.
import {readFileSync,writeFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const p='catalog/addon-cycle-ledger-v0.json',l=JSON.parse(readFileSync(p)),expr=ops=>ops.map(o=>`(${o.count})*`+(o.op==='runtime.call.subledger'?`CALL(${o.target})`:o.op==='runtime.callback'?`CALLBACK(${o.target})`:`C(${o.op})`)).join('+');
for(const u of l.units.filter(u=>u.source.includes('worker-minimal-views')&&u.source.includes('-proofs'))){
 if(u.cycleCount.note.includes('C65:'))throw Error('C65 already applied');
 const count=u.name==='probeCache'?'S':u.name==='storeBound'?'PUB':null;
 if(count){
  u.operations=u.operations.filter(o=>!((o.op==='memory.load.u32'||o.op==='alu.shr.u32')&&o.count===count));
  for(const o of u.operations)if(o.op==='alu.and.u32'&&o.count===count+'+1')o.count=1;
 }
 const key=u.cycleCount.activeCycleExpression?'activeCycleExpression':'expression';u.cycleCount[key]=expr(u.operations);
 u.cycleCount.note+=' C65: known recurrence mover replaces repeated metadata word/shift/and in proof probe/storeBound. Store already receives mover; probe adds one scalar after prepared fields, exact-key and tag/CAS/absolute-gauge semantics unchanged. Remaining field/address counts exclude deleted extraction; argument/register/inlining pressure remains measured-machine debt. No new frame/table/flag/guard/allocation.';
}
for(const s of new Set(l.units.filter(u=>u.source.includes('worker-minimal-views')&&u.source.includes('-proofs')).map(u=>u.source))){
 const b=Buffer.from(readFileSync(s,'utf8').replaceAll('\r\n','\n'));l.decomposedSourceBlobs[s]=createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
}
writeFileSync(p,JSON.stringify(l,null,2)+'\n');
