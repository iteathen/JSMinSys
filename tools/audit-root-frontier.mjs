// Structural detector, not a cycle predictor or a general JavaScript parser.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';

const withoutComments=s=>s.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g,'');
export function checkHotBody(body,site){
  const code=withoutComments(body);
  for(const [pattern,reason] of [
    [/\bnew\s|\b(?:async|await|yield)\b/,'allocation or asynchronous execution'],
    [/['"`]/,'string use'],
    [/\b(?:Map|Set|Promise|BigInt|JSON|console|process|performance|Date)\b/,'general runtime machinery'],
    [/\.(?:set|slice|subarray|map|filter|sort|join|toString)\s*\(/,'materialization or general collection operation'],
    [/(?:return|=)\s*[\[{]/,'object/array construction'],
    [/\b(?:fromMoves|connect4RbaFromMoves|registerHooks|eval)\b/,'cold ingress or source rewriting'],
  ])assert.ok(!pattern.test(code),`${site}: ${reason}`);
  assert.ok(!/\]\s*\(/.test(code),`${site}: unbound indexed callable`);
  for(const m of code.matchAll(/([\w.]+)\s*\(/g)){
    const target=m[1];if(!target.includes('.'))continue;
    assert.ok(/^(Math\.(imul|clz32|min|max)|Atomics\.(load|store|compareExchange|add)|state\.behaviorLoad|profile\.(prepareRemove|removePrepared|prepareSubset|shapeSubsetPrepared|permuteCoordinates))$/.test(target)||
      /^[\w.]+\.fill$/.test(target),`${site}: unbound method ${target}`);
  }
}
function bodyOf(source,name){
  const s=withoutComments(source),start=s.indexOf('function '+name+'(');
  assert.ok(start>=0,'missing function '+name);
  let at=s.indexOf('(',start),depth=1;
  while(depth){at++;if(s[at]==='(')depth++;if(s[at]===')')depth--;assert.ok(at<s.length);}
  at=s.indexOf('{',at);const begin=at+1;depth=1;
  while(depth){at++;if(s[at]==='{')depth++;if(s[at]==='}')depth--;assert.ok(at<s.length);}
  return s.slice(begin,at);
}
export function auditRootFrontier(){
  const ledger=JSON.parse(readFileSync('catalog/addon-cycle-ledger-v0.json','utf8')),
    core=JSON.parse(readFileSync('catalog/functions-v0.json','utf8')),
    units=new Map([...ledger.units.map(u=>[u.name,u]),...core.functions.map(u=>[u.name,u])]),
    pending=['searchCpcOnlyFrontier','completeRootFrontierNode32','releaseNarrowFrontier'],seen=new Set();
  while(pending.length){
    const name=pending.pop();if(seen.has(name))continue;seen.add(name);
    const u=units.get(name);assert.ok(u,'unledgered hot target '+name);
    const source=readFileSync(u.source,'utf8');assert.ok(!source.includes('/experiments/'),u.source);
    const body=bodyOf(source,name);checkHotBody(body,u.source+'#'+name);
    for(const o of u.operations??[]){
      if(o.op==='runtime.call.subledger')pending.push(o.target);
      if(o.op==='runtime.callback'){
        const targets=ledger.isomaxSystemCycleGraph.callbackTargets[o.target];assert.ok(targets,'unresolved callback '+o.target);
        pending.push(...targets.map(t=>t.split('#')[1]));
      }
    }
    // Source calls supplement the ledger traversal; primitives must not hide a
    // transitive escape simply because their catalog lacks add-on CALL edges.
    for(const m of body.matchAll(/(?<![.\w])([A-Za-z_$][\w$]*)\s*\(/g)){
      const target=m[1];if(['if','for','while','switch','return'].includes(target))continue;
      const resolved=target==='completeBehaviorNode32'?'completeRootFrontierNode32':target;
      assert.ok(units.has(resolved),'unresolved direct hot call '+name+' -> '+target);pending.push(resolved);
    }
  }
  const frontier=readFileSync('addons/rba-connect4-frontier.mjs','utf8');
  checkHotBody(frontier.slice(frontier.indexOf('  // HOT PFIF action loop:'),frontier.indexOf('// Root-boundary action only;')),'root frontier loop');
  assert.ok(!/campaign|recurring|JSMINSYS_FLAG_DISPATCH|RBA_FRONTIER_UNUSED/.test(frontier),'retired campaign machinery');
  return [...seen].sort();
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
  console.log(`Root-frontier structural audit: ${auditRootFrontier().length} transitive functions checked; source/call checks only, not a machine-code cost claim.`);
