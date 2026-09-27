// Cold analysis only. Censored visitation rates are not time-to-solve scores.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const out=resolve(process.argv[2]),read=f=>JSON.parse(readFileSync(resolve(out,f),'utf8'));
const manifest=read('manifest.json'),complete=read('complete.json');
const rows=readFileSync(resolve(out,'samples.jsonl'),'utf8').trim().split('\n').map(JSON.parse);
assert.equal(manifest.sustained,true);assert.equal(rows.length,3);assert.equal(complete.trials,3);
for(const r of rows){
  assert.equal(r.config.timeoutMs,300000);assert.equal(r.root,'');
  assert.equal(r.workersExited,4);assert.equal(r.cleanup,true);assert.equal(r.errors.length,0);
  assert.ok(r.status==='EXACT'?r.rootWdl===1:r.status==='TIMEOUT'&&r.rootWdl===null);
  assert.equal(r.benchmarkNodeCounts.reduce((a,b)=>a+b,0),r.totalNodes);
  assert.equal(BigInt(r.bootstrapCycles)+BigInt(r.setupCycles)+BigInt(r.solveCycles),BigInt(r.totalProcessCycles));
}
rows.sort((a,b)=>a.config.shared-b.config.shared);
const baseline=rows.find(r=>r.config.shared===1048576),f=(x,n=3)=>x.toFixed(n);
const summary={sha:manifest.sha,complete,workers:4,durationMs:300000,
  rows:rows.map(r=>({id:r.config.id,cacheMiB:r.cacheBytes/1048576,
    status:r.status,rootWdl:r.rootWdl,wallMs:r.wallMs,totalNodes:r.totalNodes,
    visitsPerSecond:r.visitsPerSecond,solveCycles:r.solveCycles,totalProcessCycles:r.totalProcessCycles,
    cyclesPerVisit:r.cyclesPerVisit,relativeRateTo1M:r.visitsPerSecond/baseline.visitsPerSecond,
    sampledPeakRssMiB:r.sampledPeakRssBytes/1048576,sharedCacheHits:r.sharedCacheHits,
    sharedCacheStores:r.sharedCacheStores,sharedCacheStoreContention:r.sharedCacheStoreContention})),
  disposition:'Single sustained sample per size. Throughput bracket only; no statistical equivalence or solved-time optimum established. No production setting changed.'};
writeFileSync(resolve(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');
let report=`# Sustained IsoMax memory bracket\n\nTested ${manifest.sha} on ${manifest.cpu}, Windows, Node ${manifest.node}.\nFour native Lazy SMP workers, sharedSampleMask=7, empty board, 300 seconds per\nrun. Order: 1M,512K,2M. No strategist or worker behavior changes. Existing\nall-worker node-count loader; identical instrumentation across sizes.\n\nThe owner rejected the earlier short selection campaign. Its 72 short solves\nand four captured 30-second diagnostics are retained separately and excluded\nfrom this comparison. The next short sample was uncollected after controller\ntermination. No short sample selects memory.\n\n| Shared entries / private entries per worker | Cache MiB total | Status | Seconds | Total visits | Mvisits/s | Cycles/visit | Sampled peak RSS MiB | Rate vs 1M |\n|---|---:|---|---:|---:|---:|---:|---:|---:|\n`;
for(const r of summary.rows)report+=`| ${r.id} | ${f(r.cacheMiB,2)} | ${r.status} | ${f(r.wallMs/1000)} | ${r.totalNodes.toLocaleString('en-US')} | ${f(r.visitsPerSecond/1e6)} | ${f(r.cyclesPerVisit,1)} | ${f(r.sampledPeakRssMiB,1)} | ${f((r.relativeRateTo1M-1)*100,2)}% |\n`;
report+=`\nCache payload formula: shared entries *64 +12 bytes, plus four private caches\nat 61 bytes/entry each. Total cache payload excludes runtime and geometry.\nRSS is sampled once per second and is a lower bound on actual peak.\nCycles/visit uses all-process cycles during the native operation divided by\nall-worker visits, not just winner nodes. Raw data preserves bootstrap, setup,\nsolve, and total-process cycle counts separately.\n\nAll three runs exited all four workers with cleanup true and no errors.\nTIMEOUT is censored; it produces no root WDL or completed-solve time.\nVisit rate is work throughput, not proof progress. Different cache sizes may\nchange search paths and duplicate work. One run per size does not measure\nrepeatability, establish equivalence, or locate a universal solve-time cap.\nShared and private capacities changed together; their independent effects are\nnot identified by this bracket.\n\nEarlier five-minute evidence at another revision found ~4.28% higher visitation\nthroughput from 64K to 1M and ~0.29% from 1M to 2M. It motivated this bracket\nbut is not pooled with current results. No production default was changed.\nSee FINDINGS.md for interpretation.\n\nReproduce at the tested SHA:\n\n    node experiments/strategist/memory-campaign.mjs <new-output-directory> --sustained\n\nUse the pinned Node runtime with experimental FFI available. Manifests record\nsource hashes, arms, host, Node/V8, and revision. Raw subprocess logs preserve\nper-second RSS/cycle samples and exact final outcomes.\n`;
writeFileSync(resolve(out,'RESULTS.md'),report);
console.log(JSON.stringify(summary,null,2));
