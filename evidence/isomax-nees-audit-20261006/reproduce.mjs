// Read-only inventory audit. No solver imports, execution, rewriting or timings.
import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const frozen='40b19431f00174c5d52c442677d67ec698e8c50a',ledgerPath='catalog/addon-cycle-ledger-v0.json',
 read=p=>JSON.parse(readFileSync(p,'utf8')),
 gitText=p=>execFileSync('git',['show',frozen+':'+p],{encoding:'utf8',maxBuffer:16*1024*1024}),
 gitRead=p=>JSON.parse(gitText(p));
function audit(l,f){
 const byId=new Map(l.units.map(u=>[u.unit,u])),byName=new Map();
 for(const u of l.units){const a=byName.get(u.name)||[];a.push(u);byName.set(u.name,a);}
 const sealed=new Set(f.functions.map(u=>u.name)),seen=new Set(),pending=[...l.isomaxSystemCycleGraph.roots],graphErrors=[];
 while(pending.length){
  const id=pending.pop();if(seen.has(id))continue;seen.add(id);const u=byId.get(id);
  if(!u){graphErrors.push({id,kind:'missing'});continue;}
  for(const o of u.operations){
   if(o.op==='runtime.call.subledger'&&!sealed.has(o.target)){
    const a=byName.get(o.target)||[];if(a.length===1)pending.push(a[0].unit);else graphErrors.push({id,target:o.target,matches:a.length});
   }else if(o.op==='runtime.callback'){
    const a=l.isomaxSystemCycleGraph.callbackTargets?.[o.target];
    if(a)pending.push(...a);else if(!l.isomaxSystemCycleGraph.disabledCallbacks?.[o.target])graphErrors.push({id,target:o.target,kind:'unresolvedCallback'});
   }
  }
 }
 const unboundCounts=[],ambiguousCalls=[],targetlessCallbackExpressions=[];
 for(const u of l.units)for(const o of u.operations){
  if(typeof o.count==='string')for(const term of new Set([...o.count.matchAll(/\b[A-Z][A-Z0-9_]*\b/g)].map(m=>m[0])))
   if(!Object.hasOwn(u.cycleCount.parameters||{},term))unboundCounts.push({unit:u.unit,term,count:o.count});
  if(o.op==='runtime.call.subledger'&&!sealed.has(o.target)){
   const n=(byName.get(o.target)||[]).length;if(n!==1)ambiguousCalls.push({unit:u.unit,target:o.target,matches:n});
  }
  if(o.op==='runtime.callback'&&!String(u.cycleCount.expression).includes('CALLBACK('+o.target+')'))
   targetlessCallbackExpressions.push({unit:u.unit,target:o.target,expression:u.cycleCount.expression});
 }
 const compiled=l.units.filter(u=>/minimal-views-compiled.*local32/.test(u.source)&&u.name==='<module-main>');
 return {summary:l.summary,reachableUnits:seen.size,graphErrors,unboundCounts,ambiguousOrAbsentCalls:ambiguousCalls.length,
  absentCalls:ambiguousCalls.filter(x=>x.matches===0),
  nameMatches:Object.fromEntries(['negamax','probeCache','storeExact','localKeyMatches','storeLocalEntry'].map(n=>[n,(byName.get(n)||[]).length])),
  compiledLocal32ModuleMains:compiled.map(u=>({id:u.unit,reachable:seen.has(u.unit)})),targetlessCallbackExpressions,seen,byId};
}
const ledger=read(ledgerPath),current=audit(ledger,read('catalog/functions-v0.json')),
 fl=gitRead(ledgerPath),prior=audit(fl,gitRead('catalog/functions-v0.json')),lock=read('isomax/provenance.json');
let covered=0;const uncovered=[],mismatches=[];
for(const [path,r] of Object.entries(lock.files)){
 if(!path.startsWith('runtime/addons/'))continue;
 const expected=fl.decomposedSourceBlobs[r.source];if(!expected){uncovered.push({path,source:r.source});continue;}
 covered++;const s=readFileSync('isomax/'+path,'utf8').replaceAll('\r\n','\n'),
  actual=createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
 if(actual!==expected)mismatches.push({path,source:r.source,expected,actual});
}
const workers=lock.workerModules.map(p=>'addons/'+p.split('/').pop()+'#<module-main>'),packageResult={
 lockedFiles:Object.keys(lock.files).length,ledgerOrAuthorityLocks:Object.keys(lock.files).filter(p=>/catalog|ledger|COST|SPEC|CONFORMANCE/.test(p)),
 coveredAddonFiles:covered,uncovered,mismatches,frozenWorkerCount:workers.length,
 frozenWorkerRootsInLedger:workers.filter(id=>prior.byId.has(id)).length,frozenWorkerRootsReachable:workers.filter(id=>prior.seen.has(id)).length};
const source='addons/rba-connect4-lazy-smp-worker-minimal-views-compiled-proofs-local32.mjs',
 text=readFileSync(source,'utf8'),publication=text.slice(text.lastIndexOf('if(relative!==CANCELLED)')),
 publicationUnit=ledger.units.find(u=>u.source===source&&u.name==='<module-main>'),publicationCheck={source,
  sourceAtomicStoresInCompletionBranch:[...publication.matchAll(/Atomics\.store\(/g)].length,
  ledgerAtomicStores:publicationUnit.operations.filter(o=>o.op==='atomic.store.u32'),testDescription:publicationUnit.cycleCount.parameters.TEST};
delete current.seen;delete current.byId;delete prior.seen;delete prior.byId;
const result={method:'Read-only declarations and reproduction of current flat graph resolver. Not a JavaScript AST graph or emitted-machine-cost proof.',
 auditHead:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),current,
 frozen:{ref:frozen,ledgerGitBlob:execFileSync('git',['rev-parse',frozen+':'+ledgerPath],{encoding:'utf8'}).trim(),...prior},
 packageResult,publicationCheck,badRegexMatchesOrdinaryTerms:/\\b[A-Z][A-Z0-9_]*\\b/g.test('IC + FS + OA + ERR')};
writeFileSync(new URL('reproduction.json',import.meta.url),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({currentReach:current.reachableUnits,total:ledger.units.length,unboundCounts:current.unboundCounts,
 compiledLocal32Reach:current.compiledLocal32ModuleMains.filter(r=>r.reachable).length,targetlessCallbacks:current.targetlessCallbackExpressions.length,
 frozenReach:prior.reachableUnits,packageResult,publicationCheck,badRegexMatchesOrdinaryTerms:result.badRegexMatchesOrdinaryTerms},null,2));
