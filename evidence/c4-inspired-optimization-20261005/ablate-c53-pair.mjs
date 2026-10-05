// Offline temporary interaction ablation. Restore named source/ledger paths
// from 0ea983c after measurement; never alter search rules or add an option.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const path='addons/rba-connect4-lazy-smp-worker-minimal.mjs';
let s=readFileSync(path,'utf8').replaceAll('\r\n','\n');
const binding='pairHub=prepareConnect4CpcxPairHub32(g),evaluatePairHub=pairHub.find,collectSingletons=pairHub.collect,';
assert.equal(s.split(binding).length,2);
s=s.replace(binding,'pairHub=prepareConnect4CpcxPairHub32(g),collectSingletons=pairHub.collect,');
const block=`  // Current mover has two distinct playable demands and no counterterminal.
  const fork=evaluatePairHub(words,src,basis,bi,n,mover,forced,forbiddenBase);
  if(fork>=0){
    if(depth)storeExact(src,hash,slot,relativeToAbsolute(1,mover));
    else bestMove=fork;
    return 1;
  }

`;
assert.equal(s.split(block).length,2);s=s.replace(block,'');writeFileSync(path,s);
const lp='catalog/addon-cycle-ledger-v0.json',l=JSON.parse(readFileSync(lp,'utf8'));
for(const u of l.units.filter(u=>u.source.includes('worker-minimal')&&u.name==='negamax')){
 u.operations=u.operations.filter(o=>!(o.op==='runtime.call.subledger'&&o.target==='findConnect4CpcxPairHub32'));
 const k=u.cycleCount.activeCycleExpression?'activeCycleExpression':'expression';
 u.cycleCount[k]=u.operations.map(o=>`(${o.count})*`+(o.op==='runtime.call.subledger'?`CALL(${o.target})`:`C(${o.op})`)).join('+');
 u.cycleCount.note+=' Temporary C53ablation removes early pair proof entirely, current exact singleton restrictions unchanged. Generic symbolic reached-branch parameters no longer include fork branch.';
}
writeFileSync(lp,JSON.stringify(l,null,2)+'\n');
