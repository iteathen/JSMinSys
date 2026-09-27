// Cold descriptive screen analysis; censored runs never rank as solved latency.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const out=resolve(process.argv[2]),read=n=>JSON.parse(readFileSync(resolve(out,n))),
  rows=readFileSync(resolve(out,'samples.jsonl'),'utf8').trim().split('\n').map(JSON.parse),
  complete=read('complete.json'),selected=read('holdout-selection.json');
assert.equal(rows.length,complete.trials);assert.ok(rows.every(r=>r.cleanup&&!r.forcedTerminations&&!r.errors.length));
assert.ok(rows.every(r=>r.status==='TIMEOUT'?r.value===null:r.status==='EXACT'&&r.value===1));
const mean=a=>a.reduce((a,b)=>a+b,0)/a.length;
const median=a=>{a=[...a].sort((a,b)=>a-b);return (a[(a.length-1)>>1]+a[a.length>>1])/2;};
const gm=a=>Math.exp(mean(a.map(Math.log)));
const stages={};
for(const stage of [...new Set(rows.map(r=>r.stage))]){
  stages[stage]={};
  for(const id of [...new Set(rows.filter(r=>r.stage===stage).map(r=>r.config.id))]){
    const rs=rows.filter(r=>r.stage===stage&&r.config.id===id),latencies=rs.filter(r=>r.status==='EXACT').map(r=>r.solveWallMs);
    const byRoot=Object.fromEntries([...new Set(rs.map(r=>r.root))].map(root=>{
      const xs=rs.filter(r=>r.root===root),exact=xs.filter(r=>r.status==='EXACT');
      return [root,{n:xs.length,solved:exact.length,medianMs:exact.length===xs.length?median(exact.map(r=>r.solveWallMs)):null,
        meanNodes:mean(xs.map(r=>r.nodes)),meanCycles:mean(xs.map(r=>Number(r.evaluatorCycles))),
        meanProcessCycles:mean(xs.map(r=>Number(r.processTotalCycles))),
        meanJoinedMs:mean(xs.map(r=>r.wallMs)),active:xs.map(r=>r.evaluators.filter(e=>e.activated).length),
        winners:xs.map(r=>r.winner),sharedHits:xs.map(r=>r.cacheStats[0]),
        horizonStops:xs.map(r=>r.evaluators.reduce((a,e)=>a+(e.result.metrics.horizonStops??0),0))}];
    }));
    stages[stage][id]={config:rs[0].config,n:rs.length,solved:latencies.length,
      geometricMeanMs:latencies.length===rs.length?gm(latencies):null,
      cachePayloadBytes:rs[0].cacheMemory.privateCacheBytesPerWorker*rs[0].workers+rs[0].cacheMemory.sharedCacheBytes,byRoot};
  }
}
const holdouts=[];
for(const pair of selected){
  const stage='holdout-'+pair.family,rs=rows.filter(r=>r.stage===stage),byRoot={};
  for(const root of [...new Set(rs.map(r=>r.root))]){
    const a=rs.filter(r=>r.root===root&&r.config.id===pair.control.id).sort((a,b)=>a.round-b.round),
      b=rs.filter(r=>r.root===root&&r.config.id===pair.candidate.id).sort((a,b)=>a.round-b.round);
    assert.equal(a.length,4);assert.equal(b.length,4);
    if([...a,...b].some(r=>r.status!=='EXACT')){byRoot[root]={disposition:'CENSORED'};continue;}
    const ratios=a.map((r,i)=>b[i].solveWallMs/r.solveWallMs),m=mean(ratios),se=Math.sqrt(ratios.reduce((s,x)=>s+(x-m)**2,0)/3/4);
    byRoot[root]={meanDeltaPct:100*(m-1),interval95Pct:[100*(m-3.182*se-1),100*(m+3.182*se-1)],ratios};
  }
  holdouts.push({family:pair.family,control:pair.control.id,candidate:pair.candidate.id,byRoot});
}
const summary={trials:rows.length,solved:rows.filter(r=>r.status==='EXACT').length,timeouts:rows.filter(r=>r.status==='TIMEOUT').length,
  stages,holdouts,scope:'Two-repeat training screens; four-repeat paired mirrored holdouts. Descriptive unadjusted intervals. No optimum/promotion claim.'};
writeFileSync(resolve(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({trials:summary.trials,solved:summary.solved,timeouts:summary.timeouts,holdouts},null,2));
const manifest=read('manifest.json'),f=x=>x.toFixed(1);
let report=`# Worker, memory, profile and admission interaction screen

Tested JSMinSys ${manifest.sha}; ${manifest.cpu}; Windows; Node ${manifest.node}.
Experimental IsoMax mode-capable engine, full CPC retained. Production unchanged.

234/234 trials returned the expected exact absolute P1 value (1); no timeout,
error or forced termination. This value is not mover-relative rootWdl.
11 targeted mode/activation tests passed; see tests.txt. This is not full NEES
qualification or a standard Fhourstones score.

There were 31 stage configurations: 13 resource configurations, 10 profile
configurations and 8 admission configurations. These are combinations of seven
named policies, not 234 distinct strategies. Screening used 186 trials; two
selected pairs received 48 confirmation trials. No dynamic candidate qualified
for confirmation under the predeclared gate.

## Findings

- One-worker base had the lowest overall resource-screen latency. Two workers
  were faster on A; eight workers were slower than one worker on all three roots.
- Four-worker shared-TT doubling screened 2.57% faster than same-count base.
  Confirmation did not establish a repeatable benefit.
- Four-worker wide-anchor (worker 0 wide, others deep) screened 2.58% faster than
  same-count all-deep. Its confirmation aggregate was effectively unchanged.
- Starting one and admitting on sustained positive pending-width deltas beat
  immediate full activation at four workers, but lost to keeping one active.
  At eight workers it helped A, hurt B/B15 versus fixed-all, and lost overall to
  fixed-one. Expansion alone did not identify economically useful parallelism.
- No candidate is promoted. This screen does not establish optimal memory or
  disprove mixed roles/PFIF. The windows are short and the games are related.

## Method and boundaries

Primary: common ready barrier to first exact evaluator completion, conditional
on validated result and clean shutdown. Joined time and cold process time are
also retained. Fresh process/caches, 20 warmups, 750 ms deadline, requested 5 ms
strategist cadence, sequential trials; no timeout or memory-policy changes.
Two rotated screening repetitions per root. Four alternating paired confirmation
repetitions on mirrors, which are correlated games, not independent new games.
Intervals below are descriptive, unadjusted paired t intervals with only 4 pairs.

A = 2053635233350500; B = 1320461024522311; B15 = 132046102452231.
Confirmation uses their reflected sequences. B15 is the parent of B, further
limiting generalization. No affinity control; this host has heterogeneous cores.
Eight worker indices reuse seven nominal move-order offsets.

Base capacities: 4096 private entries per worker, 16384 shared entries.
private2/shared2/both2 double those respective capacities. Cache MiB is allocated
payload, not process RSS or total retained memory. Increasing worker count also
increases total private storage. Memory selection for later stages: four workers
shared2; eight workers base. Selection is exploratory, not a proven optimum.

Profiles share the plain mode engine. Dynamic arms ALL use the observed mode
engine; do not attribute cross-stage timing differences solely to policy.
Wide means the existing exact shallow-band mode (stride 2), not heuristic leaves.
Worker 1 is helper; worker 0 is anchor; odd/even select half the pool.
Dynamic activation only admits preinitialized workers in ascending ID order.
There is no migration, suspension, arbitrary activation-order search or adaptive
wide/deep reassignment in this batch. The worker hot loop and TT are unchanged.

## Solve latency

Times are per-root medians (ms); GM is geometric mean across individual runs.
Tables use A/B/B15 ordering, reflected for confirmation.
`;
for(const [stage,configs] of Object.entries(stages)){
  report+=`\n### ${stage}\n\n| Configuration | Cache MiB | A | B | B15 | GM ms |\n|---|---:|---:|---:|---:|---:|\n`;
  for(const [id,c] of Object.entries(configs))report+=`| ${id} | ${(c.cachePayloadBytes/1048576).toFixed(2)} | ${Object.values(c.byRoot).map(x=>f(x.medianMs)).join(' | ')} | ${f(c.geometricMeanMs)} |\n`;
}
report+='\n## Paired confirmation\n\nNegative means candidate faster. Every interval includes zero.\n\n| Family | Mirrored root | Mean change | Descriptive 95% interval |\n|---|---|---:|---|\n';
for(const h of holdouts)for(const [root,x] of Object.entries(h.byRoot))report+=`| ${h.family} | ${root} | ${f(x.meanDeltaPct)}% | [${x.interval95Pct.map(f).join(', ')}]% |\n`;
report+='\n## Dynamic execution and whole-operation cost\n\nActive counts below are observed evaluator entry, for the two repeats at each root.\n\n| Configuration | A active | B active | B15 active |\n|---|---|---|---|\n';
for(const [id,c] of Object.entries(stages.dynamic))report+=`| ${id} | ${Object.values(c.byRoot).map(x=>x.active.join(', ')).join(' | ')} |\n`;
report+='\nArithmetic means across the six screening runs per configuration. Evaluator cycles\ncover search through return (including losing workers); strategist cycles are\nseparate. Process cycles include startup, warmups and other runtime threads, so\nare not interchangeable with search cycles. Sum cycles/node is diagnostic, not\na promotion objective. Thread counts and allocation can raise cold costs.\n\n| Stage/configuration | Nodes | Evaluator Mcycles | Strategist Mcycles | Process Mcycles | Joined ms |\n|---|---:|---:|---:|---:|---:|\n';
for(const stage of ['resources','profiles','dynamic'])for(const id of Object.keys(stages[stage])){
  const rs=rows.filter(r=>r.stage===stage&&r.config.id===id);
  report+=`| ${stage}/${id} | ${Math.round(mean(rs.map(r=>r.nodes)))} | ${f(mean(rs.map(r=>Number(r.evaluatorCycles)))/1e6)} | ${f(mean(rs.map(r=>Number(r.strategist.cycles)))/1e6)} | ${f(mean(rs.map(r=>Number(r.processTotalCycles)))/1e6)} | ${f(mean(rs.map(r=>r.wallMs)))} |\n`;
}
report+=`\n## Interpretation and next experiments

More workers did more aggregate work without reliably reducing these solve times.
Shared-hit counts do not identify cross-worker usefulness, and this evidence
cannot isolate contention from duplication, scheduling or cache effects.
Width-triggered admissions occurred, but that establishes implementation activity,
not strategically profitable work allocation. Requested cadence is not actual
delivery cadence: raw traces retain observed tick times and flag publication;
evaluator searchStarted records actual entry. Standbys still consume prepared
memory. There is no claim that these short trials predict empty-board scaling.

Next bounded contrasts should separate composition from order: same final deep/
wide roles with different admitted indices, then role changes tied to fresh width
contraction/expansion rather than simply adding more deep workers. Compare each
against matched fixed-role and fixed-count controls on harder independent roots.
Only then test memory interactions with surviving policies. These follow-ups are
not yet implemented or measured, and must stay within strategist/flag scope.

## Reproduction and evidence

See ../../experiments/strategist/INTERACTION_CAMPAIGN.md for predeclared selection.
At the tested SHA run node experiments/strategist/interaction-campaign.mjs into
a new evidence directory. Analyze with experiments/strategist/analyze-interactions.mjs.
The manifest pins runtime hashes; samples.jsonl contains every result/cycle count,
cache statistic, evaluator result and strategist trace. processes.jsonl preserves
subprocess output. summary.json holds per-root data and paired ratios. No historical
failure was overwritten and no production defaults were changed.
`;
writeFileSync(resolve(out,'RESULTS.md'),report);
