// Offline audit correction: selected support kernels must appear in the ledger.
// Never imported by workers; no algorithm/configuration changes.
import {readFileSync,writeFileSync} from 'node:fs';
const path='catalog/addon-cycle-ledger-v0.json',ledger=JSON.parse(readFileSync(path,'utf8'));
function expression(operations){return operations.map(o=>`(${o.count})*`+(o.op==='runtime.call.subledger'?`CALL(${o.target})`:o.op==='runtime.callback'?`CALLBACK(${o.target})`:`C(${o.op})`)).join('+');}
for(const u of ledger.units.filter(u=>u.source.includes('worker-minimal')&&u.name==='negamax')){
 const resource=u.source.endsWith('-resources.mjs'),call=(target,count)=>({op:'runtime.call.subledger',target,count}),ops=[];
 if(resource)ops.push(call('resourceCofactor','A*(1-CL)'));
 else for(const dense of [false,true]){
  const kind=dense?'Dense':'Prepared',k=dense?'KD':'(1-KD)';
  ops.push(call('connect4Rba'+kind+'CofactorNonWinningKnownHeight',`A*(1-SB)*${k}`));
  ops.push(call('connect4RbaSupport'+kind+'CofactorNonWinningKnownHeight',`A*SB*(1-CL)*${k}`));
 }
 for(const dense of [false,true])for(const three of [false,true]){
  const kind=dense?'Dense':'Prepared',k=dense?'KD':'(1-KD)',w=three?'THREE':'(1-THREE)';
  ops.push(call('connect4RbaClosure'+kind+(three?'3':'Span')+(resource?'Resource':'')+'CofactorNonWinningKnownHeight',`A*CL*${k}*${w}`));
 }
 ops.push(call('connect4RbaPreparedCanonicalize','R*(1-MIRROR)'),call('connect4RbaSupportCanonicalize','R*MIRROR'));
 u.operations=u.operations.filter(o=>!(o.op==='runtime.call.subledger'&&(o.target.includes('Cofactor')||o.target.includes('Canonicalize'))));
 u.operations.push(...ops);
 Object.assign(u.cycleCount.parameters,{SB:'Cold complete support-basis plan binding0/1.',CL:'Cold complete closure binding0/1; implies SB.',THREE:'Cold coordWords===3 binding0/1, independent of literal board dimensions.',MIRROR:'Cold complete support-reflection binding0/1.',
  H:resource?'1 only for a non-root node surviving resource cuts; hash/probe do not execute on earlier returns.':'1 only for a non-root node surviving cooperative stop.',
  R:resource?'Nonterminal child actions still requiring canonicalization/recursion after empty-both proof; excludes physical terminals and term12 draw proofs.':'Nonterminal child actions requiring canonicalization and recursive search.',
  BND:'Zero-threshold bound retention; explicit proof pool additionally publishes transported bounds through its storeBound subledger.'});
 u.cycleCount.activeCycleExpression=expression(u.operations);
 u.cycleCount.note+=' Offline binding audit: cofactor and canonicalizer costs now explicitly name actual cold-selected ordinary/support/closure/reflection callees. No hot selector is introduced. Resource fallback delegates to the qualified ordinary cofactor named by its cold capture. This replaces stale pre-C21/C26 call targets; does not alter code or reverse sharing policy.';
}
const proof=ledger.units.find(u=>u.name==='prepareSharedProofCacheAccess');
for(const op of proof.operations)if(['runtime.field.load','control.test.u32','control.branch'].includes(op.op))op.count=2;
proof.cycleCount.expression=expression(proof.operations);
proof.cycleCount.note+=' Offline guard audit includes explicit proofDomain read/type predicate/branch plus layout selection; invalid-domain exception allocation is a cold failure cost, not a solve-path omission.';
const material=ledger.units.find(u=>u.name==='materializePreparedConnect4SearchResult32');
material.operations.push({op:'runtime.field.store',count:1});material.cycleCount.expression=expression(material.operations);
material.cycleCount.note+=' C48 explicit resourceBounds result field population is counted once outside search.';
const host=ledger.units.find(u=>u.source==='addons/rba-connect4-lazy-smp-host.mjs'&&u.name==='runLazySmpConnect4Rba32');
host.operations.push({op:'runtime.field.store',count:'MIN'});host.cycleCount.parameters.MIN='1 only for minimal preparation option forwarding.';
host.cycleCount[host.cycleCount.activeCycleExpression?'activeCycleExpression':'expression']=expression(host.operations);
host.cycleCount.note+=' C48 resourceBounds option field populated once on the minimal host forwarding path.';
writeFileSync(path,JSON.stringify(ledger,null,2)+'\n');
