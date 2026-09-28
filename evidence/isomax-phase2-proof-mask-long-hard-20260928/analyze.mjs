import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const dir='evidence/isomax-phase2-proof-mask-long-hard-20260928';
const raw=readFileSync(dir+'/processes.jsonl','utf8').trim().split('\n').map(JSON.parse);
const rows=raw.map(p=>({...JSON.parse(p.stdout),index:p.index,arm:p.arm}));
assert.ok(rows.length===2||rows.length===8);
for(const [i,r] of rows.entries()){
 assert.equal(r.index,i);assert.equal(r.arm,'ABBAABBA'[i]);
 assert.equal(raw[i].status,0);assert.equal(raw[i].error,null);
 assert.equal(r.config.timeoutMs,300000);assert.equal(r.config.workers,4);
 assert.equal(r.config.rootFrontier,true);assert.equal(r.config.sharedCacheCapacity,4194304);assert.equal(r.config.localCacheCapacity,1048576);assert.equal(r.config.sharedSampleMask,0);
 assert.equal(r.cleanup,true);assert.equal(r.workersExited,4);assert.deepEqual(r.errors,[]);
 assert.ok(r.nodeCounts.every(n=>Number.isSafeInteger(n)&&n>0));
 if(r.status==='EXACT'){assert.equal(r.rootWdl,-1);assert.equal(r.errorCode,0);}
 else {assert.equal(r.status,'TIMEOUT');assert.equal(r.errorCode,102);}
}
const exact=rows.filter(r=>r.status==='EXACT');assert.ok(new Set(exact.map(r=>r.move)).size<=1);
const fields=['solveCycles','wallMs','cpuMs','totalNodes','winnerNodes','cyclesPerNode','nodesPerSecond','sharedCacheHits','sharedCacheStores','sharedCacheStoreContention','processPeakRssBytes'];
const summary={samples:rows.length,allExact:exact.length===rows.length,completedPlannedSeries:rows.length===8,arms:{},paired:{},fullAbbaBlocks:[]};
for(const arm of ['A','B']){
 const rs=rows.filter(r=>r.arm===arm);
 summary.arms[arm]={sha:rs[0].sourceSha,exact:rs.filter(r=>r.status==='EXACT').length,timeouts:rs.filter(r=>r.status==='TIMEOUT').length,mean:Object.fromEntries(fields.map(f=>[f,rs.reduce((s,r)=>s+Number(r[f]),0)/rs.length])),perWorkerMean:[0,1,2,3].map(i=>rs.reduce((s,r)=>s+r.nodeCounts[i],0)/rs.length)};
}
if(summary.allExact&&rows.length===8){
 for(const f of fields){
  const ratios=[];
  for(let i=0;i<8;i+=2){const a=rows.slice(i,i+2).find(r=>r.arm==='A'),b=rows.slice(i,i+2).find(r=>r.arm==='B');ratios.push(Number(b[f])/Number(a[f]));}
  const mean=ratios.reduce((s,r)=>s+r,0)/4,se=Math.sqrt(ratios.reduce((s,r)=>s+(r-mean)**2,0)/3/4);
  summary.paired[f]={ratios,deltaPct:(mean-1)*100,interval95Pct:[(mean-3.182446305*se-1)*100,(mean+3.182446305*se-1)*100],method:'four adjacent matched pair ratios; descriptive Student t df3'};
 }
 for(let i=0;i<8;i+=4){const block=rows.slice(i,i+4),a=block.filter(r=>r.arm==='A'),b=block.filter(r=>r.arm==='B');summary.fullAbbaBlocks.push({block:i/4,cycleRatio:b.reduce((s,r)=>s+Number(r.solveCycles),0)/a.reduce((s,r)=>s+Number(r.solveCycles),0)});}
}
writeFileSync(dir+'/summary.json',JSON.stringify(summary,null,2)+'\n');
const table=['| Index | Arm | Status | Wall s | CPU s | Nodes | Cycles (billions) | Cycles/node |','|---:|---|---|---:|---:|---:|---:|---:|'];
for(const r of rows)table.push(`| ${r.index} | ${r.arm} | ${r.status} | ${(r.wallMs/1000).toFixed(3)} | ${(r.cpuMs/1000).toFixed(3)} | ${r.totalNodes} | ${(Number(r.solveCycles)/1e9).toFixed(3)} | ${r.cyclesPerNode.toFixed(1)} |`);
writeFileSync(dir+'/table.md',table.join('\n')+'\n');console.log(JSON.stringify(summary));console.log(table.join('\n'));
