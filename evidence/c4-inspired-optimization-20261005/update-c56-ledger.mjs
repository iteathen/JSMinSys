// Offline reached-domain refinement. No runtime counters or source fork.
import {readFileSync,writeFileSync} from 'node:fs';
const path='catalog/addon-cycle-ledger-v0.json',l=JSON.parse(readFileSync(path,'utf8'));
for(const u of l.units.filter(u=>u.source.includes('worker-minimal')&&u.name==='negamax')){
 u.cycleCount.parameters.RESP_TESTS='C56actual response===2/depth/alpha tests before target plus response===1 and later response===2/beta predicates. Short-circuit reached predicates only.';
 u.cycleCount.parameters.RESP_BRANCHES='C56corresponding reached branches; no separate target path on sufficient NONLOSS cutoff.';
 u.cycleCount.parameters.NONLOSS_CUT='Depth>0 and current alpha>=0 with response2. Upper0 publication retained even if an unexecuted target might prove stronger exact LOSS.';
 u.cycleCount.note+=' C56moves sufficient upper0 cutoff before target evaluator, which remains independently available on all unresolved windows/root branches. Existing target-call domain now excludes NONLOSS_CUT; original caller window and root-witness rules unchanged. This may save evaluation but forgo stronger exact sharing, judged empirically.';
}
writeFileSync(path,JSON.stringify(l,null,2)+'\n');
