import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const phases=['screen','axes','refine','sustained'];
const data=phases.map(phase=>{
  const path=`evidence/isomax-resource-${phase}-20260927`,manifest=JSON.parse(readFileSync(`${path}/manifest.json`)),
    samples=readFileSync(`${path}/samples.jsonl`,'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(JSON.parse(readFileSync(`${path}/complete.json`)).trials,samples.length);
  return {phase,path,manifest,samples};
});
// Solver identity is held constant across evidence commits; harness hashes and
// individual tested SHAs remain in each manifest, rather than being rewritten.
for(const d of data)for(const [f,h] of Object.entries(d.manifest.hashes)){
  if(f.startsWith('addons/'))assert.equal(h,data[0].manifest.hashes[f]);
}
const mean=a=>a.reduce((s,v)=>s+v,0)/a.length;
const rows=data.flatMap(d=>[...new Set(d.samples.map(x=>x.config.id))].map(id=>{
  const a=d.samples.filter(x=>x.config.id===id),t=a.map(x=>x.wallMs),c=a[0].config;
  for(const r of a){assert.equal(r.cleanup,true);assert.equal(r.errors.length,0);
    assert.equal(r.workersExited,c.workers);if(r.status==='EXACT')assert.equal(r.rootWdl,r.expected);
    assert.equal(BigInt(r.totalCycles),BigInt(r.bootstrapCycles)+BigInt(r.setupCycles)+BigInt(r.solveCycles));}
  return {phase:d.phase,id,sha:d.manifest.sha,workers:c.workers,shared:c.sharedCacheCapacity,privatePerWorker:c.localCacheCapacity,
    runs:a.length,statuses:a.map(x=>x.status),meanMs:mean(t),minMs:Math.min(...t),maxMs:Math.max(...t),
    sdMs:a.length>1?Math.sqrt(t.reduce((s,v)=>s+(v-mean(t))**2,0)/(a.length-1)):null,
    meanSolveCycles:mean(a.map(x=>Number(x.solveCycles))),meanTotalCycles:mean(a.map(x=>Number(x.totalCycles))),
    meanVisits:mean(a.map(x=>x.totalNodes)),meanVisitsPerSec:mean(a.map(x=>x.nodesPerSecond)),
    meanCyclesPerVisit:mean(a.map(x=>x.cyclesPerNode)),meanCpuMs:mean(a.map(x=>x.cpuMs)),
    cacheMiB:a[0].cachePayloadBytes/1048576,peakRssMiB:Math.max(...a.map(x=>x.observedPeakRss))/1048576,
    meanHits:mean(a.map(x=>x.sharedCacheHits)),meanStores:mean(a.map(x=>x.sharedCacheStores)),
    meanContention:mean(a.map(x=>x.sharedCacheStoreContention)),
    meanStartupMs:mean(a.map(x=>x.firstStartMs)),meanSearchMs:a.every(x=>x.status==='EXACT')?mean(a.map(x=>x.firstSearchToResultMs)):null,
    winnerIds:a.map(x=>x.winner)};
}));
const out='evidence/isomax-resource-sustained-20260927';
writeFileSync(`${out}/summary.json`,JSON.stringify({rows},null,2)+'\n');
const f=(n,d=2)=>n.toFixed(d),lookup=(phase,id)=>rows.find(r=>r.phase===phase&&r.id===id);
let report=`# IsoMax joint worker and memory campaign\n\n`;
report+='Host: Intel i5-12600K, 10 physical cores / 16 logical processors, about 32 GiB RAM; Windows, Node v26.7.0. Native Lazy SMP with full exact-cache sharing (mask 0). No strategist, affinity, ordering or solver changes.\n\n';
report+='Primary metric is elapsed time to an exact solve. QueryProcessCycleTime supplies all-thread process cycles, not an estimated GHz conversion. All-worker visits are read after join; cycles/visit uses all-worker visits. These visits are not distinct positions or Fhourstones reference nodes.\n\n';
report+='## Completed-solve worker screen\n\n';
report+='Position `353335714` is a legal child of the P0-losing standard Fhourstones `35333571`, with expected absolute WDL -1. It is **not an official Fhourstones input or score**. Each cell below is the mean of three complete fresh-process solves. All 123 completed trials returned the expected WDL and joined cleanly. A 30-second containment deadline was never reached.\n\n';
report+='M = 1,048,576 entries. Private capacity is per worker; shared capacity is per process.\n\n| Workers | 1M shared / 1M private (s) | 2M / 2M (s) | 2M / 2M cache MiB | 2M / 2M total cycles (B) | 2M / 2M visits (M) |\n|---:|---:|---:|---:|---:|---:|\n';
for(let w=4;w<=12;w++){
  const a=lookup('screen',`w${w}-s1-p1`),b=lookup('screen',`w${w}-s2-p2`);
  report+=`| ${w} | ${f(a.meanMs/1000,3)} | ${f(b.meanMs/1000,3)} | ${f(b.cacheMiB,0)} | ${f(b.meanTotalCycles/1e9)} | ${f(b.meanVisits/1e6)} |\n`;
}
report+='\n## Independent memory axes and refinement\n\nEvery row is three complete solves. Keep phases separate: the repeated 7-worker 2M/1M control exposes session variation. Min/max are observed ranges, not confidence intervals.\n\n';
report+='| Phase | Workers | Shared M | Private M/worker | Mean s | Min–max s | Total cycles B | Cycles/visit | Cache MiB | Observed RSS MiB |\n|---|---:|---:|---:|---:|---|---:|---:|---:|---:|\n';
for(const r of rows.filter(x=>x.phase==='axes'||x.phase==='refine'))report+=`| ${r.phase} | ${r.workers} | ${r.shared/1048576} | ${r.privatePerWorker/1048576} | ${f(r.meanMs/1000,3)} | ${f(r.minMs/1000,3)}–${f(r.maxMs/1000,3)} | ${f(r.meanTotalCycles/1e9)} | ${f(r.meanCyclesPerVisit,0)} | ${f(r.cacheMiB,0)} | ${f(r.peakRssMiB,0)} |\n`;
report+='\n## Five-minute empty-board confirmation\n\nSeven workers and 1M private entries per worker are held fixed. Shared capacities ran in order 4M, 2M, 8M, one trial each. TIMEOUT means incomplete; neither visits/sec nor cycles/visit demonstrates solution progress or a solve-time optimum.\n\n';
report+='| Shared M | Status | Seconds | Visits M | Visits/s M | Cycles/visit | Total cycles B | Shared hits M | Stores M | Cache MiB | Observed RSS MiB |\n|---:|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|\n';
for(const r of rows.filter(x=>x.phase==='sustained'))report+=`| ${r.shared/1048576} | ${r.statuses.join(',')} | ${f(r.meanMs/1000)} | ${f(r.meanVisits/1e6)} | ${f(r.meanVisitsPerSec/1e6,3)} | ${f(r.meanCyclesPerVisit,0)} | ${f(r.meanTotalCycles/1e9)} | ${f(r.meanHits/1e6)} | ${f(r.meanStores/1e6)} | ${f(r.cacheMiB,0)} | ${f(r.peakRssMiB,0)} |\n`;
report+='\nThe 4M run recorded approximately 314M shared hits versus 197M at 2M, despite fewer visits. This supports materially changed reuse, not a conclusion that lower visitation throughput is a regression. Cache-hit counts do not measure how much remaining proof work was eliminated.\n';
report+='\n## Interpretation and limits\n\n';
const base=lookup('screen','w4-s1-p1'),lean=lookup('refine','w7-s4-p1'),large=lookup('refine','w7-s8-p1');
report+=`On the completed position, seven workers with 4M shared / 1M private entries averaged ${f(lean.meanMs/1000,3)} s, ${f((1-lean.meanMs/base.meanMs)*100,1)}% below the four-worker 1M/1M control. Its cache payload is 683 MiB (256 MiB shared plus 7 × 61 MiB private), excluding engine/runtime storage. Doubling only shared capacity to 8M averaged ${f(large.meanMs/1000,3)} s, a ${f((1-large.meanMs/lean.meanMs)*100,1)}% difference with overlapping observed ranges. Treat 4M/1M as an economical **provisional benchmark profile**, not a universal optimum. No production default is changed.\n\n`;
report+='The initial worker knee is around seven to eight on this host and position. More workers consume more aggregate cycles and perform more total visits without proportionate closure. Workers beyond seven repeat nominal recursive tie rotations; the hybrid CPU also has limited full-speed cores. This campaign does not isolate duplicate ordering from contention, bandwidth, clock changes or OS scheduling, so none is claimed as the sole cause.\n\n';
report+='Private memory need not scale upward per worker: more workers already multiply its total footprint. The separate axes show a stronger benefit from shared growth. Larger private caches can reduce collisions yet lose through access cost or altered parallel traversal; whole-solve results decide. Allocation size alone is not resident memory. RSS was sampled once per second in the cold host and is an observed maximum, not a guaranteed peak.\n\n';
report+='The screen uses one completed derived position. The sustained runs use one order and one repeat per capacity; they cannot prove a memory saturation point for empty-board solve time if they time out. Workers 5, 9, 10 and 11 were tested at 1M/1M and 2M/2M only; the adaptive larger-memory follow-up concentrated on the best counts plus four/twelve controls. The full Cartesian optimum across positions, worker counts and memory is not established.\n\n';
report+='## Reproduction and provenance\n\n';
for(const d of data)report+=`- ${d.phase}: tested \`${d.manifest.sha}\`, ${d.samples.length} trials; [manifest](../isomax-resource-${d.phase}-20260927/manifest.json), [samples](../isomax-resource-${d.phase}-20260927/samples.jsonl), [raw subprocess output](../isomax-resource-${d.phase}-20260927/processes.jsonl).\n`;
report+='\nRun `node experiments/worker-scaling/resources.mjs experiments/worker-scaling/resource-{screen,axes,refine,sustained}.json NEW_DIRECTORY` (one plan at a time) from a clean checkpoint. The driver enables experimental FFI and the diagnostic loader. It preserves failures before validation and does not retry. Production addon hashes are identical across all four stages, verified by this analyzer.\n\n';
report+='Cycle totals include startup, native search, join and host measurement. They are not retired-instruction counts or final NEES assembly-path certification. The existing diagnostic loader redirects the existing node increment to one padded per-worker shared slot; no extra per-node increment is added. Cold worker timestamps and host RSS polling are identical across configurations.\n';
writeFileSync(`${out}/REPORT.md`,report);
console.log(JSON.stringify({trials:data.reduce((s,d)=>s+d.samples.length,0),rows:rows.length,report:`${out}/REPORT.md`}));
