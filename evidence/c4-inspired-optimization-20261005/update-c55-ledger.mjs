// Offline exact cost ownership movement; apply once to retained C51/C53 ledger.
import {readFileSync,writeFileSync} from 'node:fs';
const path='catalog/addon-cycle-ledger-v0.json',l=JSON.parse(readFileSync(path,'utf8')),
 source='addons/connect4-cpcx-pair-hub.mjs',expr=ops=>ops.map(o=>`(${o.count})*`+(o.op==='runtime.call.subledger'?`CALL(${o.target})`:`C(${o.op})`)).join('+');
const spoke=l.units.find(u=>u.source===source&&u.name==='addSpoke');
spoke.operations.push({op:'memory.load.u32',count:'GUARDS'},{op:'alu.shr.u32',count:'GUARDS'},
 {op:'alu.shl.u32',count:'GUARDS'},{op:'alu.and.u32',count:'2*GUARDS'},{op:'alu.add.u32',count:'GUARDS'});
spoke.cycleCount.parameters.GUARDS='Only accessible compatible spokes consult current forbidden mask before any seen/first storage.';
spoke.cycleCount.parameters.COUNT='One Boolean seen read only after exact mask exclusion.';
spoke.cycleCount.parameters.WRITE_COUNT='Only first valid spoke writes1; no count2 or failed255 writes.';
spoke.cycleCount.parameters.TEST='Reached forced/support/mask/seen/duplicate tests; no obsolete failed-count comparison.';
spoke.cycleCount.expression=expr(spoke.operations);
spoke.cycleCount.note+=' C55absorbed failed-trigger guard moves mask read here, ahead of bookkeeping; must charge all reached GUARDS rather than rare old positive candidates. No runtime reporting.';
const find=l.units.find(u=>u.source===source&&u.name==='findConnect4CpcxPairHub32');
find.operations.find(o=>o.op==='memory.load.u32').count='SOURCE+BASIS';
find.operations=find.operations.filter(o=>!String(o.count).includes('CHECKS'));
find.operations.find(o=>o.op==='memory.store.u8').count='RESET';
delete find.cycleCount.parameters.CHECKS;delete find.cycleCount.parameters.FAIL;
find.cycleCount.parameters.TEST='Reached cardinality/loop/candidate predicates; positive candidate returns immediately without a late guard.';
find.cycleCount.expression=expr(find.operations);
find.cycleCount.note+=' C55finder no longer stores failed sentinel or repeats known mask on positives; unchanged per-call seen reset remains charged. addSpoke owns every early mask access.';
writeFileSync(path,JSON.stringify(l,null,2)+'\n');
