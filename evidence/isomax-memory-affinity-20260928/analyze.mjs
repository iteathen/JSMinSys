import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const dir='evidence/isomax-memory-affinity-20260928',mode=process.argv[2]??'shared';
const rows=readFileSync(`${dir}/${mode}-samples.jsonl`,'utf8').trim().split('\n').map(JSON.parse);
const mean=a=>a.reduce((x,y)=>x+y,0)/a.length;
const metrics=['solveCycles','wallMs','cpuMs','totalNodes','winnerNodes','sharedCacheHits','sharedCacheStores','sharedCacheStoreContention','processPeakRssBytes','cyclesPerNode'];
let result={mode,samples:rows.length,exact:rows.filter(r=>r.status==='EXACT').length,sourceSha:rows[0].sourceSha};
if(rows.length===8&&rows.every(r=>r.status==='EXACT')){
 assert.deepEqual(rows.map(r=>r.arm).join(''),'ABBAABBA');
 assert.ok(rows.every(r=>r.rootWdl===rows[0].rootWdl&&r.move===rows[0].move));
 result.metrics={};
 for(const key of metrics){
  const deltas=[];
  for(let i=0;i<8;i+=2){const pair=rows.slice(i,i+2),a=pair.find(r=>r.arm==='A'),b=pair.find(r=>r.arm==='B');deltas.push((Number(b[key])/Number(a[key])-1)*100);}
  const m=mean(deltas),sd=Math.sqrt(deltas.reduce((s,d)=>s+(d-m)**2,0)/3),margin=3.182446305*sd/2;
  const blockRatios=[];
  for(let i=0;i<8;i+=4){const block=rows.slice(i,i+4);blockRatios.push(mean(block.filter(r=>r.arm==='B').map(r=>Number(r[key])))/mean(block.filter(r=>r.arm==='A').map(r=>Number(r[key]))));}
  result.metrics[key]={A:mean(rows.filter(r=>r.arm==='A').map(r=>Number(r[key]))),B:mean(rows.filter(r=>r.arm==='B').map(r=>Number(r[key]))),pairedDeltasPct:deltas,meanDeltaPct:m,interval95Pct:[m-margin,m+margin],blockRatios};
 }
 result.interval='descriptive paired t(df=3), four adjacent pairs; not pooled with previous runtime populations';
}else result.disposition='CENSORED_OR_INCOMPLETE: no exact solve-speed ratio';
writeFileSync(`${dir}/${mode}-analysis.json`,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(result,null,2));
