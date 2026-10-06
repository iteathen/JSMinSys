// Explicit, scoped cold accounting repairs for the20261006 audit. No broad source resealing.
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
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
}else throw Error('Unknown scoped NEES ledger repair: '+action);
writeFileSync(path,JSON.stringify(ledger,null,2)+'\n');
