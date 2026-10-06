// Cold catalog validation; never imported by solver runtime.
import assert from 'node:assert/strict';

export function validateCycleSymbols(unit){
 const parameters=new Set(Object.keys(unit.cycleCount.parameters??{}));
 const expression=String(unit.cycleCount.expression??'')
  .replace(/\bCALLBACK\([^)]*\)/g,' ')
  .replace(/\bCALL\([^)]*\)/g,' ')
  .replace(/\bC\([^)]*\)/g,' ');
 for(const text of [expression,...unit.operations.map(o=>String(o.count))])
  for(const match of text.matchAll(/\b[A-Z][A-Z0-9_]*\b/g))
   assert.ok(parameters.has(match[0]),`${unit.unit}: unbound symbolic cycle term ${match[0]}`);
}
