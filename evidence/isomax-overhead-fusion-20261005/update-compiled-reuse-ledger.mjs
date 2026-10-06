// Offline source/cost inventory update for the reviewed cold reuse fix.
import {readFileSync,writeFileSync} from 'node:fs';import {createHash} from 'node:crypto';
const path='catalog/addon-cycle-ledger-v0.json',l=JSON.parse(readFileSync(path)),source='addons/rba-connect4-support-compiled-transition.mjs',
 u=l.units.find(u=>u.source===source&&u.name==='prepareSupportCompiledTransitions32');
if(u.operations.some(o=>o.op==='runtime.instanceof.check'))throw Error('reuse ledger already applied');
for(const o of u.operations)if(typeof o.count==='string')o.count=o.count.replaceAll('ADMIT','BUILD');
u.operations.push({op:'runtime.instanceof.check',count:'REUSE_TYPE'});
delete u.cycleCount.parameters.ADMIT;
Object.assign(u.cycleCount.parameters,{
 BUILD:'1when a fresh/replacement plane fits the auxiliary budget;0fallback or compatible supplied-plan reuse.',
 REUSE_TYPE:'0..4 reached cold typed-array/shared-buffer checks after byte/sentinel compatibility.',
 LEGAL_CHECK:'BUILD*profiles*columns, includes full-column skip;0reuse.',
 F:'Actual cold plan/geometry/array fields, including short-circuit reuse guards and replacement byte-accounting fields.',
 TEST:'Reached validation/width/column/row/member/stability/reuse predicates.',
 SUB:'Executed decrements and replacement subtraction of old transition-only retained/working bytes.'
});
u.cycleCount.expression=u.operations.map(o=>`(${o.count})*`+(o.op==='runtime.call.subledger'?`CALL(${o.target})`:o.op==='runtime.callback'?`CALLBACK(${o.target})`:`C(${o.op})`)).join('+');
u.cycleCount.note+=' Reviewed cold reuse: eligible shared planes returned by identity before compiler/allocation; incompatible replacement subtracts old transition bytes before adding new payload. No worker/hot-body change.';
const b=Buffer.from(readFileSync(source,'utf8').replaceAll('\r\n','\n'));
l.decomposedSourceBlobs[source]=createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
writeFileSync(path,JSON.stringify(l,null,2)+'\n');
