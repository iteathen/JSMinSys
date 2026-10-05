// Offline cost/source accounting; no timed-worker instrumentation.
import {readFileSync,writeFileSync} from 'node:fs';
const path='catalog/addon-cycle-ledger-v0.json',l=JSON.parse(readFileSync(path,'utf8')),
 source='addons/connect4-cpc-prepared-response.mjs';
if(l.units.some(u=>u.source===source))throw Error('C51already applied');
const unit=structuredClone(l.units.find(u=>u.name==='evaluateConnect4PreparedCpcWin32'));
if(!unit)throw Error('Missing prepared WIN cost authority');
unit.source=source;unit.name='evaluateConnect4PreparedCpcResponse32';unit.unit=source+'#'+unit.name;
unit.cycleCount.note+=' C51same common legal policy; denial scanned first, optional own guarantee only after full denial. Parameters count actually reached reads/scans, including NONLOSS2; failed own guarantee is no longer an unresolved exit. No additional initialization table/scratch or hot allocations/counters.';
unit.operations.push({op:'control.test.u32',count:1},{op:'control.branch',count:1});
const expr=ops=>ops.map(o=>`(${o.count})*`+(o.op==='runtime.call.subledger'?`CALL(${o.target})`:`C(${o.op})`)).join('+');
unit.cycleCount.expression=expr(unit.operations);l.units.push(unit);
for(const u of l.units.filter(u=>u.source.includes('worker-minimal')&&u.name==='negamax')){
 for(const o of u.operations)if(o.op==='runtime.call.subledger'&&o.target==='evaluateConnect4PreparedCpcWin32')o.target=unit.name;
 u.operations.push({op:'control.test.u32',count:'RESP_TESTS'},{op:'control.branch',count:'RESP_BRANCHES'},
  {op:'runtime.call.subledger',count:'NONLOSS_CUT',target:'storeBound'});
 Object.assign(u.cycleCount.parameters,{RESP_TESTS:'Actually reached response===1/===2,depth,alpha>=0,beta>0 predicates beyond old WIN-only branch.',RESP_BRANCHES:'Corresponding reached branches.',NONLOSS_CUT:'One only for depth>0 and controller NONLOSS with current alpha>=0; upper0 fact retained with unchanged storeBound/gauge protocol.'});
 const k=u.cycleCount.activeCycleExpression?'activeCycleExpression':'expression';u.cycleCount[k]=expr(u.operations);
 u.cycleCount.note+=' C51one-sided current mover upper0 intersects caller window, original-window result classification retained. Root must search for a legal optimal witness unless a WIN certificate supplies any legal losing action.';
}
writeFileSync(path,JSON.stringify(l,null,2)+'\n');
