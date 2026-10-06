// Cold static ledger resolution, not a runtime JavaScript dispatcher or AST proof.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {posix} from 'node:path';

export function resolveCycleGraph(ledger,sealedFunctions,readSource=p=>readFileSync(p,'utf8')){
 const graph=ledger.isomaxSystemCycleGraph,byId=new Map(ledger.units.map(u=>[u.unit,u])),byName=new Map(),
  sealed=new Map(sealedFunctions.map(f=>[f.name,f])),imports=new Map(),reachable=new Set(),pending=[...graph.roots],edges=[];
 for(const u of ledger.units){const a=byName.get(u.name)??[];a.push(u);byName.set(u.name,a);}
 function bindings(source){
  if(imports.has(source))return imports.get(source);
  const result=new Map(),text=readSource(source).replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,'');
  for(const m of text.matchAll(/\bimport\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g)){
   if(!m[2].startsWith('.'))continue;
   const path=posix.normalize(posix.join(posix.dirname(source),m[2]));
   for(const item of m[1].split(',')){
    const parts=item.trim().split(/\s+as\s+/);if(!parts[0])continue;
    result.set(parts[1]??parts[0],{source:path,name:parts[0]});
   }
  }
  imports.set(source,result);return result;
 }
 function resolveCall(u,target){
  if(byId.has(target))return target;
  const local=u.source+'#'+target;if(byId.has(local))return local;
  const imported=bindings(u.source),binding=imported.get(target),
   canonical=binding?[binding]:[...imported.values()].filter(b=>b.name===target);
  const ids=[...new Set(canonical.map(b=>b.source+'#'+b.name))];
  if(ids.length){
   assert.equal(ids.length,1,`${u.unit}: imported CALL(${target}) is ambiguous`);
   if(byId.has(ids[0]))return ids[0];
   const f=sealed.get(canonical[0].name);
   assert.ok(f&&f.source===canonical[0].source,`${u.unit}: imported CALL(${target}) cannot resolve ${ids[0]}`);
   return null;
  }
  if(sealed.has(target))return null;
  // Catalog class-method/prepared semantic names may differ from source bindings.
  // Only a unique explicit unit is accepted; never choose an arbitrary first match.
  const matches=byName.get(target)??[];
  assert.equal(matches.length,1,`${u.unit}: CALL(${target}) cannot resolve uniquely (${matches.length}; ambiguous or absent)`);
  return matches[0].unit;
 }
 while(pending.length){
  const id=pending.pop();if(reachable.has(id))continue;
  const u=byId.get(id);assert.ok(u,`IsoMax cycle-graph missing unit: ${id}`);
  assert.equal(u.status,'decomposed',`${id}: reachable unit must be decomposed`);
  assert.ok(!u.operations.some(o=>o.op==='runtime.legacy.addon.body'),`${id}: reachable legacy body`);
  reachable.add(id);
  for(const o of u.operations){
   if(o.op==='runtime.call.subledger'){
    const target=resolveCall(u,o.target);edges.push({from:id,target:o.target,resolved:target??'SEALED'});
    if(target)pending.push(target);
   }else if(o.op==='runtime.callback'){
    const targets=graph.callbackTargets?.[o.target];
    if(targets){assert.ok(targets.length,`${id}: empty callback targets`);pending.push(...targets);}
    else assert.ok(graph.disabledCallbacks?.[o.target],`${id}: unresolved callback ${o.target}`);
   }
  }
 }
 return {reachable,edges};
}
