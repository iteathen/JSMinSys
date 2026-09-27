import {readFileSync,writeFileSync} from 'node:fs';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const directory=process.argv[2];
if(!directory)throw Error('evidence directory required');
const rows=readFileSync(join(directory,'screen.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
const metadata=rows[0],trials=rows.filter(r=>r.type==='trial');
assert.equal(trials.length,42);
const median=a=>a.sort((a,b)=>a-b)[a.length>>>1];
const groups=[];
for(const root of metadata.roots)for(const label of metadata.labels){
  const runs=trials.filter(r=>r.fixture.moves.join('')===root&&r.label===label);
  assert.equal(runs.length,3);
  for(const r of runs){assert.equal(r.cleanup,true);assert.equal(r.forcedTerminations,0);assert.deepEqual(r.errors,[]);}
  const exact=runs.filter(r=>r.status==='EXACT'),metrics=runs.map(r=>r.evaluators[0].result.metrics);
  const cycles=median(runs.map(r=>Number(r.evaluatorCycles)));
  const baseline=trials.filter(r=>r.fixture.moves.join('')===root&&r.label==='baseline');
  const baselineCycles=median(baseline.map(r=>Number(r.evaluatorCycles)));
  for(const r of exact){assert.equal(r.value,baseline[0].value);assert.equal(r.evaluators[0].result.move,baseline[0].evaluators[0].result.move);}
  const releases=runs.map(r=>r.strategist?.trace.find(t=>t.flags?.some(f=>f&4194304))?.ms).filter(v=>v!==undefined);
  groups.push({root,label,exact:exact.length,timeouts:runs.filter(r=>r.status==='TIMEOUT').length,
    medianCycles:cycles,cycleChangePercent:exact.length===3?(cycles/baselineCycles-1)*100:null,
    medianNodes:median(runs.map(r=>r.nodes)),medianCyclesPerNode:median(runs.map(r=>r.cyclesPerNode)),
    medianSolveMs:exact.length===3?median(exact.map(r=>r.solveWallMs)):null,
    medianStrategistCycles:runs[0].strategist?median(runs.map(r=>Number(r.strategist.cycles))):null,
    passCounts:metrics.map(m=>m.frontierPasses??null),horizonStops:metrics.map(m=>m.horizonStops??null),
    releasePublicationMs:releases,allCycles:runs.map(r=>Number(r.evaluatorCycles))});
}
const summary={testedSha:metadata.sha,node:metadata.node,trials:trials.length,exact:trials.filter(r=>r.status==='EXACT').length,
  timeouts:trials.filter(r=>r.status==='TIMEOUT').length,groups};
writeFileSync(join(directory,'summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
