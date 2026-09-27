// Cold analysis. Censored runs never enter completed-solve timing ratios.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const out=resolve(process.argv[2]),read=f=>JSON.parse(readFileSync(resolve(out,f))),
  rows=readFileSync(resolve(out,'samples.jsonl'),'utf8').trim().split('\n').map(JSON.parse),
  complete=read('complete.json'),manifest=read('manifest.json');
assert.equal(rows.length,84);assert.equal(rows.length,complete.count);
assert.ok(rows.every(r=>r.cleanup&&!r.forcedTerminations&&!r.errors.length));
assert.ok(rows.every(r=>r.status==='EXACT'?r.value===r.expected:r.status==='TIMEOUT'&&r.value===null));
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length,median=a=>{a=[...a].sort((a,b)=>a-b);return (a[(a.length-1)>>1]+a[a.length>>1])/2;};
const groups=[];
for(const stage of ['overhead','hard'])for(const key of [...new Set(rows.filter(r=>r.stage===stage).map(r=>r.key))])
for(const id of [...new Set(rows.filter(r=>r.stage===stage).map(r=>r.config.id))]){
  const rs=rows.filter(r=>r.stage===stage&&r.key===key&&r.config.id===id),sumMetric=(r,k)=>r.evaluators.reduce((s,e)=>s+(e.result.metrics[k]??0),0);
  groups.push({stage,key,id,n:rs.length,solved:rs.filter(r=>r.status==='EXACT').length,
    medianSolveMs:rs.every(r=>r.status==='EXACT')?median(rs.map(r=>r.solveWallMs)):null,
    meanNodes:mean(rs.map(r=>r.nodes)),meanEvaluatorCycles:mean(rs.map(r=>Number(r.evaluatorCycles))),
    meanStrategistCycles:mean(rs.map(r=>Number(r.strategist?.cycles??0))),meanProcessCycles:mean(rs.map(r=>Number(r.processTotalCycles))),
    meanJoinedMs:mean(rs.map(r=>r.wallMs)),active:rs.map(r=>r.evaluators.filter(e=>e.activated).length),
    meanPublications:mean(rs.map(r=>sumMetric(r,'observePublications'))),meanWordsCopied:mean(rs.map(r=>sumMetric(r,'observeWordsCopied'))),
    meanHorizonStops:mean(rs.map(r=>sumMetric(r,'horizonStops'))),
    meanActualTickMs:mean(rs.map(r=>{const t=r.strategist?.trace??[];return t.length>1?(t.at(-1).ms-t[0].ms)/(t.length-1):0;}))});
}
const comparisons=[];
const pairs={overhead:[['bare','stop-host'],['stop-host','stop-strategist'],['stop-strategist','mode-deep'],['mode-deep','observed-off'],['observed-off','observed-read'],['mode-deep','observed-read']],
  hard:[['deep4','wide0-deep3'],['minimal-fixed1','observed-fixed1'],['observed-fixed1','observed-grow1'],['minimal-fixed1','observed-grow1'],['minimal-fixed4','observed-grow1']]};
for(const [stage,ps] of Object.entries(pairs))for(const [control,candidate] of ps)
for(const key of [...new Set(rows.filter(r=>r.stage===stage).map(r=>r.key))]){
  const pick=id=>rows.filter(r=>r.stage===stage&&r.key===key&&r.config.id===id).sort((a,b)=>a.round-b.round),a=pick(control),b=pick(candidate);
  assert.equal(a.length,b.length);
  if([...a,...b].some(r=>r.status!=='EXACT')){comparisons.push({stage,key,control,candidate,disposition:'CENSORED'});continue;}
  const stats=field=>{const ratios=a.map((r,i)=>Number(b[i][field])/Number(r[field])),m=mean(ratios),n=ratios.length,
    se=Math.sqrt(ratios.reduce((s,x)=>s+(x-m)**2,0)/(n-1)/n),t=n===4?3.182:4.303;
    return {meanPct:100*(m-1),interval95Pct:[100*(m-t*se-1),100*(m+t*se-1)],ratios};};
  comparisons.push({stage,key,control,candidate,disposition:'SOLVED',sameNodes:a.every((r,i)=>r.nodes===b[i].nodes),wall:stats('solveWallMs'),cycles:stats('evaluatorCycles')});
}
const summary={...complete,groups,comparisons,scope:'Experimental diagnostic; unadjusted small-sample paired intervals; no timeout rankings.'};
writeFileSync(resolve(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');
const f=x=>x.toFixed(2);
let report=`# Observer overhead and harder-position retest

Tested ${manifest.sha}, ${manifest.cpu}, Windows, Node ${manifest.node}.
${complete.count} trials: ${complete.solved} exact, ${complete.timeouts} censored timeouts.
All returned exact values matched the declared oracle; all workers cleaned up.
Source changes are cold harness selection and strategist publication only.
No production implementation or generated recursive worker was changed.

## Measurement boundaries

Short: four rotated repetitions, one evaluator, roots A/B (15–16-ply family),
750 ms cap, private4096/shared16384. Hard: three repetitions, four prepared
workers, Fhourstones 45461667 (zero-based 34350556) and empty, 5-second cap,
private4096/shared32768. Same 20 warmups and common ready barrier; fresh caches
and process each run, no simultaneous benchmarks. Requested strategist cadence
5 ms. Timeout limits were not changed in the host.

Bare and stop-host have no strategist. Stop-strategist adds an inert one.
Mode-deep changes the execution implementation, including root query windows;
that contrast must not be presented as pure flag-decoding overhead even where
these fixtures happen to visit the same nodes. Observed-off tracks frames but
never publishes; observed-read additionally serves asynchronous raw snapshots.
General node/CPC/cache accounting remains in all arms. This is not a comparison
to an accounting-free solver. No timers or cycle reads occur per node.

Fixed-pool minimal arms use no observation storage or snapshot requests.
Observed-fixed1 retains the same observation machinery as observed-grow1.
The latter comparison isolates admission; minimal-fixed1 versus grow1 measures
the net implementation, including required observation. All active grow workers
stay DEEP. Wide0-deep3 has one shallow-band worker and no width observation.

Windows evaluator cycles cover solve through return, including losing workers.
Strategist cycles are separate; process cycles additionally include startup,
warmup, cleanup and other runtime threads. Atomic shared-TT stats and existing
solver counters remain real costs. No fixed cycle cost or speedup is inferred
from source line counts. Three/four repeats give only descriptive unadjusted
intervals; no affinity control, larger position-suite or full NEES qualification.

## Results

Solve ms is median only if every repetition solved. Timeout node counts are
work performed within the budget, not distance to solution. Mcycles are means.

| Stage/root | Arm | Solved | Solve ms | Nodes | Evaluator Mcycles | Strategist Mcycles | Process Mcycles | Active workers | Publications | Words copied |
|---|---|---:|---:|---:|---:|---:|---:|---|---:|---:|
`;
for(const g of groups)report+=`| ${g.stage}/${g.key} | ${g.id} | ${g.solved}/${g.n} | ${g.medianSolveMs===null?'censored':f(g.medianSolveMs)} | ${Math.round(g.meanNodes)} | ${f(g.meanEvaluatorCycles/1e6)} | ${f(g.meanStrategistCycles/1e6)} | ${f(g.meanProcessCycles/1e6)} | ${g.active.join(',')} | ${f(g.meanPublications)} | ${f(g.meanWordsCopied)} |\n`;
report+='\n## Paired contrasts\n\nNegative means candidate cheaper/faster. Intervals are descriptive 95% paired t intervals.\n\n| Root | Control → candidate | Same nodes | Wall change [interval] % | Evaluator-cycle change [interval] % |\n|---|---|---|---|---|\n';
for(const c of comparisons){const fmt=s=>`${f(s.meanPct)} [${s.interval95Pct.map(f).join(', ')}]`;
  report+=`| ${c.key} | ${c.control} → ${c.candidate} | ${c.sameNodes??'—'} | ${c.wall?fmt(c.wall):'censored'} | ${c.cycles?fmt(c.cycles):'censored'} |\n`;}
report+='\nNo automatic promotion. Interpret these contrasts together with their censored outcomes and mechanism boundaries. See FINDINGS.md for the reviewed conclusions.\n\nReproduce at the tested SHA: `node experiments/strategist/overhead-campaign.mjs <new-directory>`. Analyze using `node experiments/strategist/analyze-overhead.mjs <directory>`. The manifest pins sources; raw samples include thread cycles, metrics and strategist traces; subprocess output is retained separately.\n';
writeFileSync(resolve(out,'RESULTS.md'),report);
console.log(JSON.stringify(summary,null,2));
