// Offline C57reached call domains and nested gate accounting, apply once.
import {readFileSync,writeFileSync} from 'node:fs';
const path='catalog/addon-cycle-ledger-v0.json',l=JSON.parse(readFileSync(path,'utf8')),
 expr=ops=>ops.map(o=>`(${o.count})*`+(o.op==='runtime.call.subledger'?`CALL(${o.target})`:`C(${o.op})`)).join('+');
for(const u of l.units.filter(u=>u.source.includes('worker-minimal')&&u.name==='negamax')){
 for(const o of u.operations)if(o.op==='runtime.call.subledger'&&o.target==='findConnect4CpcxPairHub32')o.count='PAIR_OPEN';
 Object.assign(u.cycleCount.parameters,{CP:'One response policy check after cache and dual-singleton exits, before independent pair route.',PAIR_OPEN:'CPnodes whose response policy is0unresolved; response1/2make current WIN impossible and skip pair analysis.',RESP_TESTS:'Actual response2/then response0group gates, nested depth/alpha/beta and response1target-short-circuit tests.',RESP_BRANCHES:'Corresponding actually reached nested/fall-through branches.',NONLOSS_CUT:'Depth>0,current alpha>=0,response2; existing upper0 store/gauge protocol. Target evaluation not reached on this sufficient cutoff.',TD:'Actually reached dense target checks after pair route fails or NONLOSSstillneedsLOSS/DRAWsearch; response1short-circuits target.',TG:'Same domain, cold-selected general target path.'});
 const k=u.cycleCount.activeCycleExpression?'activeCycleExpression':'expression';u.cycleCount[k]=expr(u.operations);
 u.cycleCount.note+=' C57response-first nested refinement: policy0falls through to pair; policy1/2soundlyexclude current WIN, not a probability assumption. C56cutoff shares existingresponse2gate without an extra standalone test. No new flags/storage, originalwindow/TT/rootwitness unchanged.';
}
writeFileSync(path,JSON.stringify(l,null,2)+'\n');
