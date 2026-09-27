import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const directory=process.argv[2];
if(!directory)throw Error('evidence directory required');
const median=a=>a.slice().sort((a,b)=>a-b)[a.length>>>1];
const summaries=[];
for(const file of ['screen.jsonl','bounded-screen.jsonl','bounded-recheck.jsonl']){
  const [metadata,...rows]=readFileSync(join(directory,file),'utf8').trim().split('\n').map(JSON.parse);
  const trials=rows.filter(r=>r.type==='trial');
  assert.equal(trials.length,metadata.roots.length*metadata.labels.length*metadata.rounds);
  for(const t of trials){assert.equal(t.cleanup,true);assert.equal(t.forcedTerminations,0);assert.deepEqual(t.errors,[]);}
  const groups=[];
  for(const root of metadata.roots){
    const baseline=trials.filter(t=>t.fixture.moves.join('')===root&&t.label==='baseline');
    const oneway=trials.filter(t=>t.fixture.moves.join('')===root&&t.label==='frontier-2-narrow');
    const baseCycles=median(baseline.map(t=>Number(t.evaluatorCycles)));
    const oneCycles=median(oneway.map(t=>Number(t.evaluatorCycles)));
    for(const label of metadata.labels){
      const runs=trials.filter(t=>t.fixture.moves.join('')===root&&t.label===label);
      assert.equal(runs.length,metadata.rounds);
      const exact=runs.filter(t=>t.status==='EXACT');
      for(const t of exact){assert.equal(t.value,baseline[0].value);assert.equal(t.evaluators[0].result.move,baseline[0].evaluators[0].result.move);}
      const cycles=median(runs.map(t=>Number(t.evaluatorCycles))),metrics=runs.map(t=>t.evaluators[0].result.metrics);
      const counters={};
      for(const k of ['recurringRegions','recurringPasses','recurringReleases','recurringReentries','recurringLocalReentries',
        'recurringRetainedSkips','recurringMaxDepth','recurringBudgetReleases','recurringRearms','horizonStops']){
        if(metrics[0][k]!==undefined)counters[k]=metrics.map(m=>m[k]);
      }
      groups.push({root,label,exact:exact.length,timeouts:runs.filter(t=>t.status==='TIMEOUT').length,
        medianCycles:cycles,medianNodes:median(runs.map(t=>t.nodes)),medianCyclesPerNode:median(runs.map(t=>t.cyclesPerNode)),
        cycleVsBaselinePercent:exact.length===runs.length?100*(cycles/baseCycles-1):null,
        cycleVsOneWayPercent:exact.length===runs.length?100*(cycles/oneCycles-1):null,
        medianSolveMs:exact.length===runs.length?median(runs.map(t=>t.solveWallMs)):null,
        medianStrategistCycles:runs[0].strategist?median(runs.map(t=>Number(t.strategist.cycles))):null,
        cycles:runs.map(t=>Number(t.evaluatorCycles)),counters});
    }
  }
  summaries.push({source:file,metadata,trials:trials.length,groups});
}
writeFileSync(join(directory,'summary.json'),JSON.stringify(summaries,null,2)+'\n');
for(const s of summaries){
  console.log(s.source);
  for(const g of s.groups)console.log(g.root,g.label,'exact',g.exact,'timeouts',g.timeouts,
    'Mcycles',(g.medianCycles/1e6).toFixed(3),'nodes',g.medianNodes,'C/node',g.medianCyclesPerNode.toFixed(1),
    'vsOneWay',g.cycleVsOneWayPercent?.toFixed(2),JSON.stringify(g.counters));
}
