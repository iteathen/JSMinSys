// Explicit, scoped cold accounting repairs for the20261006 audit. No broad source resealing.
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {cycleExpressionForOperations} from './cycle-ledger-validation.mjs';
const path='catalog/addon-cycle-ledger-v0.json',ledger=JSON.parse(readFileSync(path,'utf8'));
const action=process.argv[2];
if(action==='symbols'){
 const affected=ledger.units.filter(u=>u.source==='addons/rba-connect4-shared-exact-cache-layout.mjs'&&
  ['createConnect4RbaSharedLayoutCache32','attachConnect4RbaSharedLayoutCache32'].includes(u.name));
 assert.equal(affected.length,2);
 for(const u of affected)Object.assign(u.cycleCount.parameters,{
  IC:'Executed cold integer/safe-integer predicates; path dependent, not assumed zero.',
  FS:'Executed cold descriptor/object field assignments; excludes callee internals.',
  OA:'Executed cold descriptor/object allocations; size/lifetime and engine cost remain explicit.',
  ERR:'1 on the reached throwing failure path;0 on successful creation/attachment.',
 });
}else if(action==='callbacks'){
 for(const u of ledger.units)if(u.operations.some(o=>o.op==='runtime.callback'))
  u.cycleCount.expression=cycleExpressionForOperations(u.operations);
 const graph=ledger.isomaxSystemCycleGraph;
 for(const name of ['probeIndexPartial24Shared32','probeBankedIndexPartial24Shared32',
  'storeIndexPartial24Shared32','storeBankedIndexPartial24Shared32',
  'probeIndexPartialMixedShared32','storeIndexPartialMixedShared32']){
  const matches=ledger.units.filter(u=>u.name===name);assert.equal(matches.length,1);
  graph.callbackTargets[name]=[matches[0].unit];
 }
 const source='addons/connect4-cpc-matching-response.mjs',name='<matching-slot-identity-callback>',id=source+'#'+name;
 if(!ledger.units.some(u=>u.unit===id))ledger.units.push({unit:id,source,name,scope:'cold-geometry-matching-slot-identity',status:'decomposed',
  operations:[{op:'runtime.native.access.lowering',count:'ABI'}],cycleCount:{kind:'symbolic',
   expression:'(ABI)*C(runtime.native.access.lowering)',parameters:{ABI:'Tagged argument-index return/call ABI for Array.from((_,i)=>i); source performs no arithmetic. Engine lowering unqualified, not zero.'},
   note:'Inline source callback at prepareConnect4CpcMatchingResponse32 line13. Parent owns Array.from/function construction; this callee owns argument/result propagation only.'}});
 graph.callbackTargets['cold-local-slot-identity']=[id];
 ledger.summary.units=ledger.units.length;ledger.summary.decomposed=ledger.units.filter(u=>u.status==='decomposed').length;
}else throw Error('Unknown scoped NEES ledger repair: '+action);
writeFileSync(path,JSON.stringify(ledger,null,2)+'\n');
