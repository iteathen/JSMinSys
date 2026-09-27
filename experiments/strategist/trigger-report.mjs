import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const dir=resolve(process.argv[2]),rows=readFileSync(resolve(dir,'samples.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
assert.equal(rows.length,108);assert.ok(rows.every(r=>r.status==='EXACT'&&r.value===1&&r.cleanup&&!r.errors.length));
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
const median=a=>{a=[...a].sort((a,b)=>a-b);return (a[(a.length-1)>>1]+a[a.length>>1])/2;};
const gm=a=>Math.exp(mean(a.map(Math.log)));
const summary=[];
for(const workers of [1,7])for(const trigger of ['native','read','sustained','growth','relative25','density']){
  const group=rows.filter(r=>r.config.workers===workers&&r.config.trigger===trigger);
  const control=(r,t)=>rows.find(b=>b.config.workers===workers&&b.config.root===r.config.root&&b.config.round===r.config.round&&b.config.trigger===t);
  const ratio=(field,t)=>100*(gm(group.map(r=>Number(r[field])/Number(control(r,t)[field])))-1);
  summary.push({workers,trigger,samples:group.length,meanSolveMs:mean(group.map(r=>r.solveWallMs)),
    meanNodes:mean(group.map(r=>r.nodes)),meanEvaluatorCycles:mean(group.map(r=>Number(r.evaluatorCycles))),
    meanStrategistCycles:mean(group.map(r=>Number(r.strategist?.cycles??0))),
    meanTrialProcessCycles:mean(group.map(r=>Number(r.trialProcessCycles))),
    wallVsNativePct:ratio('solveWallMs','native'),wallVsReadPct:ratio('solveWallMs','read'),
    evaluatorCyclesVsNativePct:ratio('evaluatorCycles','native'),trialProcessCyclesVsNativePct:ratio('trialProcessCycles','native'),
    nodesVsNativePct:ratio('nodes','native'),
    triggers:group.reduce((s,r)=>s+(r.strategist?.pendingPolicies?.reduce((s,p)=>s+p.triggers,0)??0),0),
    bands:group.reduce((s,r)=>s+r.evaluators.reduce((s,e)=>s+(e.result.metrics.bandStarted??0),0),0)});
}
const gaps=[],first=[];
for(const r of rows){const ts=r.strategist?.trace??[];
  for(let i=1;i<ts.length;i++)gaps.push(ts[i].ms-ts[i-1].ms);
  for(let i=0;i<r.workers;i++){const t=ts.find(t=>t.flags[i]&512);if(t)first.push({config:r.config,worker:i,
    ms:t.ms,observation:t.pendingSamples[i]});}
}
const metrics={summary,wakeupGapMs:{median:median(gaps),min:Math.min(...gaps),max:Math.max(...gaps)},
  firstCommandCount:first.length,firstCommandMsMedian:median(first.map(x=>x.ms)),
  firstCommandObservedDepthMedian:median(first.map(x=>x.observation.depth))};
writeFileSync(resolve(dir,'summary.json'),JSON.stringify(metrics,null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
