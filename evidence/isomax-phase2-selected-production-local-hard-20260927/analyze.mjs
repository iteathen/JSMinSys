// Cold post-run analysis. Two ABBA blocks are the paired sampling units.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const read=name=>readFileSync(new URL(name,import.meta.url),'utf8');
const rows=read('samples.jsonl').trim().split('\n').map(JSON.parse);
assert.equal(rows.length,8);
for(let b=0;b<2;b++)assert.equal(rows.filter(r=>r.block===b).map(r=>r.arm).join(''),'ABBA');
const exact=rows.every(r=>r.status==='EXACT');
for(const r of rows){
  assert.equal(r.cleanup,true);assert.equal(r.workersExited,7);
  assert.equal(r.nodeCounts.length,7);assert.ok(r.nodeCounts.every(n=>n>0));
  assert.equal(r.totalNodes,r.nodeCounts.reduce((a,b)=>a+b,0));
  if(r.status==='EXACT'){assert.equal(r.rootWdl,-1);assert.equal(r.move,4);}
}
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
const fields=['solveCycles','wallMs','cpuMs','totalNodes','winnerNodes','sharedCacheHits','sharedCacheStores','sharedCacheStoreContention','cyclesPerNode','nodesPerSecond','processPeakRssBytes','startSkewMs','firstSearchToResultMs'];
const value=(r,k)=>k==='winnerNodes'?r.winnerMetrics?.nodes:r[k];
const summary={fixture:'35333571',timeoutMs:120000,allExact:exact,censored:!exact,expected:{rootWdl:-1,move:4},arms:{},paired:exact?{}:null,
  method:'Within each ABBA block, B mean / A mean. Percent deltas averaged over two blocks. Descriptive Student-t interval, df=1, t=12.7062047364; very limited precision, not an independence or normality guarantee.'};
for(const arm of ['A','B']){
  const a=rows.filter(r=>r.arm===arm);
  summary.arms[arm]={sha:a[0].sha,exact:a.filter(r=>r.status==='EXACT').length,timeouts:a.filter(r=>r.status==='TIMEOUT').length,means:{},meanWorkerNodes:Array.from({length:7},(_,i)=>mean(a.map(r=>r.nodeCounts[i]))),minWorkerNodes:Math.min(...a.flatMap(r=>r.nodeCounts)),allWorkersExited:a.every(r=>r.workersExited===7&&r.cleanup),allWorkersWorked:a.every(r=>r.nodeCounts.every(n=>n>0))};
  summary.arms[arm].repeatSpread={};
  for(const k of fields){
    const raw=a.map(r=>value(r,k)),valid=raw.every(x=>x!==null&&x!==undefined);
    summary.arms[arm].means[k]=valid?mean(raw.map(Number)):null;
    if(valid){
      const v=raw.map(Number),avg=mean(v),sd=Math.sqrt(v.reduce((s,x)=>s+(x-avg)**2,0)/(v.length-1));
      summary.arms[arm].repeatSpread[k]={min:Math.min(...v),max:Math.max(...v),sampleSD:sd,coefficientOfVariationPct:avg?100*sd/avg:null};
    }
  }
}
if(exact)for(const k of fields){
  const ratios=[0,1].map(b=>mean(rows.filter(r=>r.block===b&&r.arm==='B').map(r=>Number(value(r,k))))/mean(rows.filter(r=>r.block===b&&r.arm==='A').map(r=>Number(value(r,k)))));
  const avg=mean(ratios),se=Math.sqrt(ratios.reduce((s,x)=>s+(x-avg)**2,0)/2),margin=12.7062047364*se;
  summary.paired[k]={ratios,meanDeltaPct:(avg-1)*100,interval95Pct:[(avg-margin-1)*100,(avg+margin-1)*100]};
}
writeFileSync(new URL('analysis.json',import.meta.url),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary,null,2));
