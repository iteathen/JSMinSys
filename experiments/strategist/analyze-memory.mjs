// Cold memory economics; timeout visitation is never ranked as solve progress.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const out=resolve(process.argv[2]),read=f=>JSON.parse(readFileSync(resolve(out,f))),
  readRows=dir=>readFileSync(resolve(dir,'samples.jsonl'),'utf8').trim().split('\n').map(JSON.parse),
  resume=process.argv[3]?resolve(process.argv[3]):null,
  rows=[...readRows(out),...(resume?readRows(resume):[])],
  manifest=read('manifest.json'),complete=resume?{trials:rows.length,solved:rows.filter(r=>r.status==='EXACT').length,timeouts:rows.filter(r=>r.status==='TIMEOUT').length}:read('complete.json');
if(resume){
  const m=JSON.parse(readFileSync(resolve(resume,'manifest.json')));
  for(const [file,hash] of Object.entries(manifest.hashes))if(file!=='memory-campaign.mjs')assert.equal(m.hashes[file],hash,file);
  assert.equal(readRows(resume).length,14);
  complete.stressRevision=m.sha;
}
assert.equal(rows.length,complete.trials);assert.equal(rows.length,86);
assert.ok(rows.every(r=>r.cleanup&&r.workersExited===4&&!r.errors.length));
assert.ok(rows.every(r=>r.status==='EXACT'?r.rootWdl===r.expectedWdl:r.status==='TIMEOUT'&&r.rootWdl===null));
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
const groups=[];
for(const stage of ['diagonal','axes','stress'])for(const id of [...new Set(rows.filter(r=>r.stage===stage).map(r=>r.config.id))]){
  const rs=rows.filter(r=>r.stage===stage&&r.config.id===id),byRoot={};
  for(const key of [...new Set(rs.map(r=>r.key))]){
    const xs=rs.filter(r=>r.key===key);
    byRoot[key]={n:xs.length,solved:xs.filter(r=>r.status==='EXACT').length,
      meanSolveMs:xs.every(r=>r.status==='EXACT')?mean(xs.map(r=>r.wallMs)):null,
      wallMs:xs.map(r=>r.wallMs),meanSolveCycles:mean(xs.map(r=>Number(r.solveCycles))),
      meanTotalCycles:mean(xs.map(r=>Number(r.totalProcessCycles))),
      meanVisitsPerSecond:xs.every(r=>r.totalNodes!==null)?mean(xs.map(r=>r.visitsPerSecond)):null,
      visitsPerSecond:xs.map(r=>r.visitsPerSecond),meanCyclesPerVisit:xs.every(r=>r.cyclesPerVisit!==null)?mean(xs.map(r=>r.cyclesPerVisit)):null,
      sampledPeakRssBytes:xs.map(r=>r.sampledPeakRssBytes),sharedHits:xs.map(r=>r.sharedCacheHits),sharedStores:xs.map(r=>r.sharedCacheStores)};
  }
  groups.push({stage,id,config:rs[0].config,cacheBytes:rs[0].cacheBytes,byRoot});
}
const solvedContrasts=[];
for(const stage of ['diagonal','axes'])for(const g of groups.filter(g=>g.stage===stage)){
  const baseline=groups.find(g=>g.stage===stage&&g.id==='S1024K-P1024K');
  const ratios=Object.fromEntries(Object.entries(g.byRoot).map(([key,x])=>[key,x.meanSolveMs/baseline.byRoot[key].meanSolveMs]));
  solvedContrasts.push({stage,id:g.id,ratios,geometricMeanRatio:Math.exp(mean(Object.values(ratios).map(Math.log)))});
}
const stress=groups.filter(g=>g.stage==='stress'),maxRate=Math.max(...stress.map(g=>g.byRoot.empty.meanVisitsPerSecond)),
  near=stress.filter(g=>g.byRoot.empty.meanVisitsPerSecond>=maxRate*.98).sort((a,b)=>a.cacheBytes-b.cacheBytes);
const summary={...complete,groups,solvedContrasts,
  throughputScreen:{threshold:0.98,bestObservedRate:maxRate,withinTwoPercent:near.map(g=>g.id),smallestBackingCandidate:near[0]?.id??null,
    disposition:'Candidate only: two 30-second samples; neither solve-time optimality nor five-minute saturation follows.'}};
writeFileSync(resolve(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');
const f=x=>x.toFixed(2);
let report=`# Native IsoMax cache-sizing campaign

Tested ${manifest.sha}, ${manifest.cpu}, Windows, Node ${manifest.node}.
${resume?'Stress resumed at '+complete.stressRevision+' after the preserved Windows loader-URL setup failure; sample/solver/loader source hashes match.':''}
${complete.trials} runs; ${complete.solved} exact; ${complete.timeouts} censored.
All completed WDL matched the declared oracle; all sessions joined four workers
with cleanup true and no errors. No production source or hot-loop changes.

Four native Lazy SMP workers; shared sampling mask 7; original CPC/move ordering;
no strategist, mode engine, behavior flags or warmup. One fresh process per run.
Two opposite-order repetitions, not sufficient for a statistical equivalence claim.
Cache keys are 14 uint32 lanes. Shared: 64 bytes/entry +12 total stats bytes;
private: 61 bytes/entry PER WORKER. Cache bytes exclude runtime/scratch/geometry.

Time-to-solve covers the public native operation, including worker launch,
preparation and joined shutdown. Whole-process cycles include bootstrap too.
Short solves can expose allocation/startup costs; these results do not isolate
a persistent, already-prepared worker regime. No winner-node divisor is used.

## Completed solve-time screen

Mean milliseconds from two samples. F = standard Fhourstones 45461667; A/B are
qualified midgame fixtures. Case cap 5 seconds. No all-worker-node loader here.

| Stage | Shared entries | Private entries/worker | Total cache MiB | F ms | A ms | B ms |
|---|---:|---:|---:|---:|---:|---:|
`;
for(const g of groups.filter(g=>g.stage!=='stress'))report+=`| ${g.stage} | ${g.config.shared} | ${g.config.local} | ${f(g.cacheBytes/1048576)} | ${['F45461667','A','B'].map(k=>g.byRoot[k].meanSolveMs===null?'censored':f(g.byRoot[k].meanSolveMs)).join(' | ')} |\n`;
report+=`\n## Empty-board diagnostic

Two 30-second samples each, existing all-worker-node loader only in this phase.
It redirects the existing counter to shared storage and can affect generated
code; do not mix its rates with uninstrumented timings or historic 300-second
rates as though duration/revision were identical. One-second host RSS samples
are a lower bound on peak, not exact peak. More visits are not greater proof
progress. No completed-solve conclusion follows from these censored trials.

| Shared/private K entries | Cache MiB | Mvisits/s run 1 | Mvisits/s run 2 | Mean | Mean solve cycles/visit | Sampled max RSS MiB |
|---|---:|---:|---:|---:|---:|---:|
`;
for(const g of stress){const x=g.byRoot.empty;report+=`| ${g.id} | ${f(g.cacheBytes/1048576)} | ${x.visitsPerSecond.map(x=>f(x/1e6)).join(' | ')} | ${f(x.meanVisitsPerSecond/1e6)} | ${f(x.meanCyclesPerVisit)} | ${f(Math.max(...x.sampledPeakRssBytes)/1048576)} |\n`;}
report+=`\nSmallest allocation within 2% of the best observed mean diagnostic rate:
${summary.throughputScreen.smallestBackingCandidate}. This is a screening
candidate, not a solve-time optimum or proof of saturation. Review FINDINGS.md
before choosing a campaign memory profile.

Historical reference: Connect4 research/semantic-quotient memory-sizing,
commit 12b76d3b7f5fac7c7cd6a9c4ec31e3ee37e1078c. The older 64K/1M/2M points
were single 300-second timeouts at another library revision. Their apparent
1M-to-2M throughput plateau motivated this range; it was not assumed proven.

Reproduce at tested SHA using node experiments/strategist/memory-campaign.mjs
with a new output directory. Manifests pin every arm and runtime source hash.
Raw samples and subprocess stderr preserve cycle partitions, shared-cache
statistics, progress and lifecycle results. Solver defaults remain unchanged.
`;
writeFileSync(resolve(out,'RESULTS.md'),report);
console.log(JSON.stringify({complete,solvedContrasts,throughputScreen:summary.throughputScreen},null,2));
