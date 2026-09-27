import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const phases=['scaling','endpoint','both-endpoints','sharing-density','hard-scaling'];
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
const result={};
for(const phase of phases){
  const dir=`evidence/isomax-worker-${phase}-20260927`,
    rows=readFileSync(dir+'/samples.jsonl','utf8').trim().split('\n').map(JSON.parse),
    manifest=JSON.parse(readFileSync(dir+'/manifest.json')),complete=JSON.parse(readFileSync(dir+'/complete.json'));
  assert.equal(rows.length,complete.trials);
  for(const r of rows){
    assert.equal(r.status,'EXACT');assert.equal(r.rootWdl,r.expected);assert.equal(r.cleanup,true);
    assert.equal(r.workersExited,r.config.workers);assert.equal(r.errors.length,0);
    assert.equal(r.totalNodes,r.benchmarkNodeCounts.reduce((a,b)=>a+b,0));
    assert.equal(BigInt(r.bootstrapCycles)+BigInt(r.setupCycles)+BigInt(r.solveCycles),BigInt(r.totalCycles));
  }
  const groups=[];
  for(const moves of [...new Set(rows.map(r=>r.config.moves))])for(const id of [...new Set(rows.filter(r=>r.config.moves===moves).map(r=>r.config.id))]){
    const xs=rows.filter(r=>r.config.moves===moves&&r.config.id===id),avg=k=>mean(xs.map(r=>Number(r[k])));
    groups.push({moves,id,workers:xs[0].config.workers,mask:xs[0].sharedSampleMask,n:xs.length,
      wallMs:avg('wallMs'),searchMs:avg('firstSearchToResultMs'),firstStartMs:avg('firstStartMs'),
      startSkewMs:avg('startSkewMs'),afterResultMs:avg('afterResultMs'),nodes:avg('totalNodes'),
      solveCycles:avg('solveCycles'),totalProcessCycles:avg('totalCycles'),cpuMs:avg('cpuMs'),
      hits:avg('sharedCacheHits'),stores:avg('sharedCacheStores'),contention:avg('sharedCacheStoreContention'),
      wallSamples:xs.map(r=>r.wallMs),winnerNodes:xs.map(r=>r.winnerMetrics.nodes),
      allWorkerNodes:xs.map(r=>r.benchmarkNodeCounts),movesReturned:xs.map(r=>r.move)});
  }
  result[phase]={sha:manifest.sha,trials:rows.length,groups};
}
const out=resolve('evidence/isomax-worker-hard-scaling-20260927'),f=(n,k=3)=>n.toFixed(k);
writeFileSync(resolve(out,'combined-summary.json'),JSON.stringify(result,null,2)+'\n');
const hard=result['hard-scaling'].groups,one=hard.find(g=>g.id==='full1');
let doc=`# IsoMax worker-scaling investigation and endpoint repair\n\nCurrent solver implementation: 5b21782 (both endpoint repairs). Final hard\nqualification harness: ${result['hard-scaling'].sha}. Windows/i5-12600K,\nNode26.7.0. All tests use 1M shared entries and 1M private entries per worker.\nOrdinary native workers, no strategist or behavior flag polling.\n\n## Longer completed-workload scaling\n\n353335714 is a derived child, NOT an official Fhourstones input. Its parent\n35333571 is a known absolute P0 loss; the appended legal P0 move cannot escape\nthat forced loss. All samples returned rootWdl=-1. Three separate processes per\narm, reversed order in the middle repetition. Means below; raw samples retained.\nFull sharing is sharedSampleMask=0, the existing library default.\n\n| Workers / control | Wall seconds | Search seconds | Speedup vs full1 | Total visits | Solve cycles (billions) | CPU seconds |\n|---|---:|---:|---:|---:|---:|---:|\n`;
for(const g of hard)doc+=`| ${g.id} | ${f(g.wallMs/1000)} | ${f(g.searchMs/1000)} | ${f(one.wallMs/g.wallMs,2)}x | ${Math.round(g.nodes).toLocaleString('en-US')} | ${f(g.solveCycles/1e9,2)} | ${f(g.cpuMs/1000)} |\n`;
doc+=`\nSearch time runs from the first worker entering the solver to winner completion;\nwall time includes startup and joined termination. Cycle accounting sums all\nprocess threads; it is not a per-core instruction count. More total CPU work\ncan buy lower latency. Compare like-for-like full-sharing arms and also the\nunshared single-worker control, which avoids self-publication costs. No CPU\naffinity was forced. Three repetitions do not establish universal scalability.\n\n## Reproduced defect and isolated repairs\n\nOriginally, native workers shared many CPC leaf conclusions but discarded\nrecursive endpoint proofs at narrow-window exits. On 45461667, native1 and\nthe native2 winning worker both visited exactly 806844 nodes despite sharing.\nThe four-worker group visited about 3.5 times the solo work. Startup timing,\nunshared controls, identical-order4, and solo-offset controls localized the\nproblem beyond merely counting winner nodes or thread startup.\n\n- 105cb25: a fail-high lower bound +1 is exact in {-1,0,+1}; publish against the\n  current q and mover before forced-tail sign transport.\n- 5b21782: after all relevant actions finish without beta cutoff, an upper bound\n  -1 is likewise exact. Interior draw bounds remain excluded.\n\nThe TT remains exact-only. No bound-table, manager, scheduler, root rotation,\nnew state carrier, allocation, reporting, or string work enters recursion.\nThe behavior-enabled generated variant was regenerated from the same source.\nBoth added tests/branches and nested conversion/publication costs are recorded\nin the add-on cycle ledger; whole-operation cycles include their actual costs.\n\n## Matched sampled-sharing before/after\n\nMean wall milliseconds, unchanged mask7. F is official Fhourstones45461667;\nA/B are the two declared midgame fixtures. Each cell uses three completed runs.\n\n| Root | Workers | Before | Win endpoint | Both endpoints |\n|---|---:|---:|---:|---:|\n`;
for(const [moves,label] of [['45461667','F'],['3164746344461611','A'],['2431572135633422','B']])for(const w of [1,2,3,4]){
  doc+=`| ${label} | ${w} | ${['scaling','endpoint','both-endpoints'].map(p=>f(result[p].groups.find(g=>g.moves===moves&&g.id==='native'+w).wallMs,2)).join(' | ')} |\n`;
}
doc+=`\nAfter endpoint retention, the old 1/8 sharing setting was retested against\nfull, half, and quarter sharing (72 solved trials). Full sharing improved\ncooperation on the larger F fixture; very short tasks still have startup/JIT\nand contention costs. No universal thread count or memory optimum is claimed.\nAll density results are in combined-summary.json and their own raw directory.\n\n## Verification and limits\n\n360 completed campaign trials in five phases; exact expected WDL, joined worker\ncleanup, all-worker visit sums and process-cycle partitions verified. Independent\nphysical 4x4 oracle tests exercise directed windows, reflection, all WDL values\nand forced continuation. Regression tests failed before their respective fixes.\nThe full repository suite passed 159 tests; catalog/ledger, generated behavior\nsource and runtime geometry checks passed. This is implementation/performance\nqualification, not a new full NEES machine-code conformance certification.\n\nA separate 35333571 single-worker probe at the win-only repair timed out cleanly\nat 30 seconds. A separate 353335714 selection probe completed at the both-endpoint\nrepair. Neither probe is counted as a campaign repetition. The longer child was\nselected because it completed in about 12 seconds, not for observed speedup.\nNo empty-board solve or universal parallel scaling is established.\n\nPrior memory-size results concern the old producer population. Requalify memory\nafter these repairs before pinning a memory cap. Old experimental strategist\ngenerated snapshots are historical and must be rebuilt/qualified before any\nnew comparison with this revised native solver; this task did not silently\nrewrite those historical experiments. No BSFP changes.\n\nReproduce using experiments/worker-scaling/campaign.mjs with a fresh output\ndirectory and --hard. Other modes reproduce the baseline diagnostic design or\n--density; use each manifest's exact revision for historical comparisons. The\nmeasurement-only loader admits one worker into the same native host and records\ncold timestamps. The public production API continues to require at least two.\n`;
writeFileSync(resolve(out,'REPORT.md'),doc);
console.log(JSON.stringify({trials:Object.values(result).reduce((n,p)=>n+p.trials,0),hard},null,2));
