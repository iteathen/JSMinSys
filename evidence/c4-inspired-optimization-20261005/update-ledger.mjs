// Offline experiment bookkeeping. Never imported by the timed solver.
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const path='catalog/addon-cycle-ledger-v0.json',ledger=JSON.parse(readFileSync(path,'utf8'));
const experiment=process.argv[2],sources=process.argv.slice(3);
if(experiment==='C17')for(const center of [false,true]){
 const base='addons/rba-connect4-lazy-smp-worker-minimal'+(center?'-center':'')+'.mjs',
  generated=base.replace('.mjs','-proofs.mjs');
 for(const old of ledger.units.filter(u=>u.source===base)){
  const copy=structuredClone(old);copy.source=generated;copy.unit=generated+'#'+old.unit.split('#')[1];
  ledger.units.push(copy);
 }
}
const workers=ledger.units.filter(u=>sources.includes(u.source)&&u.source.includes('worker-minimal'));
function append(u,operation,expression,parameters,note){
 u.operations.push(operation);
 const key=u.cycleCount.activeCycleExpression?'activeCycleExpression':'expression';
 u.cycleCount[key]+='+'+expression;
 Object.assign(u.cycleCount.parameters,parameters);
 u.cycleCount.note+=' '+note;
}
if(experiment==='C17'){
 const source='addons/rba-connect4-shared-proof-cache.mjs';
 ledger.units.push({unit:source+'#transportConnect4ZeroBound32',source,name:'transportConnect4ZeroBound32',scope:'shared-zero-bound-gauge',status:'decomposed',
  operations:[{op:'control.test.u32',count:'T'},{op:'control.branch',count:1},{op:'alu.sub.u32',count:'S'}],
  cycleCount:{kind:'expression',expression:'T*C(control.test.u32)+C(control.branch)+S*C(alu.sub.u32)',parameters:{T:'One tag-range test plus mover test only for bound tags.',S:'1 only when a bound changes player gauge.'},note:'C17 involutive gauge transport; exact absolute tags untouched. E1, no allocation/reporting. Actual inlining/Intel cost unqualified before full solve.'}});
 ledger.units.push({unit:source+'#prepareSharedProofCacheAccess',source,name:'prepareSharedProofCacheAccess',scope:'cold-shared-proof-bind',status:'decomposed',
  operations:[{op:'runtime.field.load',count:1},{op:'control.test.u32',count:1},{op:'control.branch',count:1},{op:'runtime.call.subledger',count:'N',target:'prepareSharedCacheAccess'},{op:'runtime.object.allocate',count:'1-N'},{op:'runtime.field.store',count:'2*(1-N)'}],
  cycleCount:{kind:'expression',expression:'C(runtime.field.load)+C(control.test.u32)+C(control.branch)+N*CALL(prepareSharedCacheAccess)+(1-N)*C(runtime.object.allocate)+2*(1-N)*C(runtime.field.store)',parameters:{N:'1 for native layout, zero for the legacy split representation.'},note:'COLD binding of unchanged exact-key publication primitives for a homogeneous minimal proof pool; protocol, identity and record size unchanged.'}});
 for(const u of workers){
  if(u.name==='probeCache'){
   append(u,{op:'runtime.call.subledger',count:'S',target:'transportConnect4ZeroBound32'},'S*CALL(transportConnect4ZeroBound32)+S*C(memory.load.u32)+S*C(alu.shr.u32)+S*C(alu.and.u32)',{},'C17 all shared probes decode absolute zero bounds to mover gauge before worker-local retention, including shared misses.');
   u.operations.push({op:'memory.load.u32',count:'S'},{op:'alu.shr.u32',count:'S'},{op:'alu.and.u32',count:'S'});
  }
  if(u.name==='storeBound'){
   append(u,{op:'runtime.call.subledger',count:'PUB',target:'transportConnect4ZeroBound32'},'PUB*CALL(transportConnect4ZeroBound32)+PUB*CALLBACK(sharedStore)+PUB*C(memory.load.u32)+PUB*C(alu.shr.u32)+PUB*C(alu.and.u32)+C(alu.and.u32)+C(control.test.u32)+C(control.branch)',{PUB:'1 when a new local bound is admitted by unchanged shared sampling; existing same/exact or inferred local draw returns without publication.'},'C17 publishes newly retained zero bounds in absolute gauge using unchanged atomic protocol; opposite local bounds still imply private exact draw.');
   u.operations.push({op:'runtime.callback',count:'PUB',target:'sharedStore'},{op:'memory.load.u32',count:'PUB'},{op:'alu.shr.u32',count:'PUB'},{op:'alu.and.u32',count:'PUB+1'},{op:'control.test.u32',count:1},{op:'control.branch',count:1});
  }
 }
}else if(experiment==='C18'){
 for(const u of workers.filter(u=>u.name==='negamax')){
  append(u,{op:'control.test.u32',count:1},'C(control.test.u32)+C(control.branch)',{},'C18 runs whole/target certificates only when forced<0; forced legal responses retain normal transition/reflection/window/terminal path. CP/TD/TG now count only branching nodes.');
  u.operations.push({op:'control.branch',count:1});
 }
}else if(experiment==='C19'){
 for(const u of ledger.units.filter(u=>sources.includes(u.source)&&u.name.includes('Cofactor')&&u.name.includes('KnownHeight'))){
  // N now counts only active visits. Owner words are loaded once per W;
  // source-mask extraction adds unary negation, xor and clz to each N.
  const replacements=new Map([
   ['memory.load.u32',c=>c.replace('2*N','2*W')],
   ['alu.and.u32',c=>c+'+K'],
   ['alu.shr.u32',c=>c.replace('+N','')+'+2*K'],
   ['alu.or.u32',c=>c.replace('N+','W+')],
   ['alu.xor.u32',c=>c+'+N'],['alu.clz.u32',c=>c+'+N']
  ]);
  const key=u.cycleCount.activeCycleExpression?'activeCycleExpression':'expression';
  for(const op of u.operations)if(replacements.has(op.op)){
   const before=String(op.count),after=replacements.get(op.op)(before);
   u.cycleCount[key]=u.cycleCount[key].replace(`(${before})*C(${op.op})`,`(${after})*C(${op.op})`);
   op.count=after;
  }
  Object.assign(u.cycleCount.parameters,{N:'Active parent basis bits visited in increasing index order, bounded by n; zero on terminal paths.',W:'ceil(n/32) owner-union words scanned on nonterminal construction; final word masked to n. SUBTRACT/ADD/TEST/BRANCH include per-word scan and per-active-bit extraction rather than inactive-slot tests.'});
  u.cycleCount.note+=' C19 active union traversal preserves increasing slot order and closure-before-absorption. Unary bit negation/index subtraction is in SUBTRACT; word-address and index additions in ADD; loops/tail/short-circuit selections in TEST/BRANCH. Word count and tail-mask shifts are included; no claim of measured Intel savings.';
 }
}else throw Error('unknown experiment');
for(const source of sources){
 const s=readFileSync(source,'utf8').replaceAll('\r\n','\n');
 ledger.decomposedSourceBlobs[source]=createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');
}
ledger.summary.units=ledger.units.length;
writeFileSync(path,JSON.stringify(ledger,null,2)+'\n');
