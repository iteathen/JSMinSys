// Cold catalog validation; never imported by solver runtime.
import assert from 'node:assert/strict';

export function validateCycleSymbols(unit){
 const parameters=new Set(Object.keys(unit.cycleCount.parameters??{}));
 const expressions=[unit.cycleCount.expression,unit.cycleCount.activeCycleExpression,
  ...(unit.cycleCount.unboundedTerms??[])].filter(t=>t!==undefined).map(t=>String(t)
   .replace(/\bCALLBACK\([^)]*\)/g,' ')
   .replace(/\bCALL\([^)]*\)/g,' ')
   .replace(/\bC\([^)]*\)/g,' '));
 for(const text of [...expressions,...unit.operations.map(o=>String(o.count))])
  for(const match of text.matchAll(/\b[A-Z][A-Z0-9_]*\b/g))
   assert.ok(parameters.has(match[0]),`${unit.unit}: unbound symbolic cycle term ${match[0]}`);
}

export function cycleExpressionForOperations(operations){
 return operations.map(o=>o.op==='runtime.call.subledger'?`(${o.count})*CALL(${o.target})`:
  o.op==='runtime.callback'?`(${o.count})*CALLBACK(${o.target})`:`(${o.count})*C(${o.op})`).join('+');
}

export function validateCycleCallbacks(unit){
 const expression=[unit.cycleCount.expression,unit.cycleCount.activeCycleExpression].filter(Boolean).join('+');
 for(const o of unit.operations)if(o.op==='runtime.callback')
  assert.ok(typeof o.target==='string'&&expression.includes(`CALLBACK(${o.target})`),
   `${unit.unit}: callback callee work must remain bound as CALLBACK(${o.target})`);
}
