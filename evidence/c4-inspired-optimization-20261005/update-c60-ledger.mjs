// Offline C60 proof-domain/cost changes. No hotcounter instrumentation.
import {readFileSync,writeFileSync} from 'node:fs';const path='catalog/addon-cycle-ledger-v0.json',l=JSON.parse(readFileSync(path));
for(const u of l.units.filter(u=>u.source.includes('worker-minimal')&&u.name==='negamax')){
 Object.assign(u.cycleCount.parameters,{PAIR_OPEN:'Response0 nodes without a consumed current-mover upper0 tag5; actual proof, not beta-window guess.',RESP_TESTS:'Actually reached response2/response0/cached!==UPPER0 subgroup and nested window/target tests. Tag5excludes pairWINbuttargetstillcanstrengthenLOSS.'});
 u.cycleCount.note+=' C60one cached tag scalar is reused across nested proofgroups. Existing depth-test moves into one conditional probe initializer; no extra probe/flagstorage. Pairgate hasone additional tag test/branch ONLYonresponse0; RESP_TESTS/BRANCHEScharge actuallyreached cost. Unknown/tag4/root retainpair, upper5maycome fromTTorfrontier. Same originalwindow classifications/rootwitness.';
}
writeFileSync(path,JSON.stringify(l,null,2)+'\n');
