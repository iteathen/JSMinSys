// COLD descriptive analysis. Eight balanced blocks; no automatic promotion.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {validateCycleSample} from './isomax-cycle-analysis.mjs';
const dir=resolve(process.argv[2]);
const rows=name=>readFileSync(resolve(dir,name),'utf8').trim().split('\n').map(JSON.parse);
const samples=rows('samples.jsonl'),diagnostic=rows('diagnostic.jsonl'),manifest=JSON.parse(readFileSync(resolve(dir,'manifest.json')));
if(samples.length!==32||diagnostic.length!==8)throw Error('incomplete campaign');
for(const s of [...samples,...diagnostic])validateCycleSample(s,manifest.sources[s.arm.charCodeAt(0)-65].sha,s.totalNodes===null?'production':'all-worker-node-instrumentation');
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
const median=a=>{a=[...a].sort((a,b)=>a-b);return (a[(a.length-1)>>1]+a[a.length>>1])/2;};
const summarize=values=>{
  const m=mean(values),se=Math.sqrt(values.reduce((s,x)=>s+(x-m)**2,0)/(values.length-1)/values.length);
  return {blockRatios:values,meanDeltaPct:100*(m-1),descriptive95Pct:[100*(m-2.365*se-1),100*(m+2.365*se-1)]};
};
const block=b=>Object.fromEntries(samples.filter(s=>s.block===b).map(s=>[s.arm,Number(s.totalProcessCycles)]));
for(let b=0;b<8;b++)if(Object.keys(block(b)).length!==4)throw Error('incomplete factorial block');
const armStats=Object.fromEntries([...'ABCD'].map(arm=>{
  const s=samples.filter(s=>s.arm===arm),d=diagnostic.filter(s=>s.arm===arm);
  return [arm,{meanCycles:mean(s.map(s=>Number(s.totalProcessCycles))),medianCycles:median(s.map(s=>Number(s.totalProcessCycles))),
    meanWallMs:mean(s.map(s=>s.wallMs)),meanSolveCycles:mean(s.map(s=>Number(s.solveCycles))),
    meanDiagnosticNodes:mean(d.map(s=>s.totalNodes)),meanDiagnosticCyclesPerVisit:mean(d.map(s=>s.cyclesPerVisit))}];
}));
const effects={};
for(const [name,fn] of Object.entries({B_vs_A:x=>x.B/x.A,C_vs_A:x=>x.C/x.A,D_vs_A:x=>x.D/x.A,
  D_vs_B:x=>x.D/x.B,D_vs_C:x=>x.D/x.C,interaction:x=>x.D*x.A/(x.B*x.C)}))
  effects[name]=summarize(Array.from({length:8},(_,b)=>fn(block(b))));
const result={armStats,effects,productionSamples:32,diagnosticSamples:8,oraclePassed:40,cleanupPassed:40,
  interpretation:'Exploratory single-fixture screen. Intervals are descriptive Student-t block-ratio intervals, unadjusted for multiple comparisons. No full NEES or production promotion.'};
writeFileSync(resolve(dir,'summary.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
