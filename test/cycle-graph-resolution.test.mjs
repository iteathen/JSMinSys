import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveCycleGraph} from '../tools/cycle-graph-resolution.mjs';
const unit=(source,name,operations=[])=>({unit:source+'#'+name,source,name,status:'decomposed',operations});

test('same-name worker functions resolve within their own module',()=>{
 const a=unit('addons/a.mjs','main',[{op:'runtime.call.subledger',target:'negamax'}]),
  an=unit('addons/a.mjs','negamax'),bn=unit('addons/b.mjs','negamax');
 const result=resolveCycleGraph({units:[a,an,bn],isomaxSystemCycleGraph:{roots:[a.unit],callbackTargets:{}}},[],()=> '');
 assert.deepEqual([...result.reachable].sort(),[a.unit,an.unit].sort());
});

test('named imported alias is bound to its source instead of global name',()=>{
 const a=unit('addons/a.mjs','main',[{op:'runtime.call.subledger',target:'run'}]),
  b=unit('addons/b.mjs','compute'),c=unit('addons/c.mjs','compute');
 const result=resolveCycleGraph({units:[a,b,c],isomaxSystemCycleGraph:{roots:[a.unit],callbackTargets:{}}},[],
  s=>s==='addons/a.mjs'?"import {compute as run} from './b.mjs';":'');
 assert.ok(result.reachable.has(b.unit));assert.ok(!result.reachable.has(c.unit));
});

test('unresolved and ambiguous calls fail closed rather than disappear',()=>{
 const a=unit('addons/a.mjs','main',[{op:'runtime.call.subledger',target:'compute'}]),
  b=unit('addons/b.mjs','compute'),c=unit('addons/c.mjs','compute');
 const graph={roots:[a.unit],callbackTargets:{}};
 assert.throws(()=>resolveCycleGraph({units:[a,b,c],isomaxSystemCycleGraph:graph},[],()=>''),/ambiguous|resolve/);
 assert.throws(()=>resolveCycleGraph({units:[a],isomaxSystemCycleGraph:graph},[],()=>''),/resolve/);
});

test('every concrete callback branch is transitively enforced',()=>{
 const a=unit('addons/a.mjs','main',[{op:'runtime.callback',target:'selected'}]),
  b=unit('addons/b.mjs','one'),c=unit('addons/c.mjs','two');
 const graph={roots:[a.unit],callbackTargets:{selected:[b.unit,c.unit]}};
 const result=resolveCycleGraph({units:[a,b,c],isomaxSystemCycleGraph:graph},[],()=> '');
 assert.equal(result.reachable.size,3);
 assert.throws(()=>resolveCycleGraph({units:[a,b],isomaxSystemCycleGraph:graph},[],()=>''),/missing unit/);
});
