// Offline, after-return validation only. Never loaded by the timed solver.
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const base=new URL('../minimal-worker-localhost-20261004/',import.meta.url);
const names=['a-fix-baseline-01','a-fix-cold-01','a-fix-bound40-01','a-fix-native32-01','a-fix-bound40-02','a-fix-native32-02'];
const rows=names.map(name=>{
  const read=file=>JSON.parse(readFileSync(new URL(name+'/'+file,base),'utf8').replace(/^\ufeff/,''));
  const run=read('stdout.json'),measurement=read('measurement.json'),invocation=read('invocation.json');
  assert.equal(run.status,'EXACT');assert.equal(run.rootWdl,1);assert.equal(run.move,3);
  assert.equal(run.cleanup,true);assert.equal(run.workersExited,4);assert.equal(run.errorCode,0);
  assert.equal(read('cleanup-verification.json').clean,true);assert.equal(measurement.timed_out,false);
  assert.equal(measurement.actual_process_affinity_mask,85);
  for(let i=0;i<4;i++){
    const affinity=read('affinity-'+i+'.json');assert.equal(affinity.actual.processor,2*i);
    assert.equal(affinity.beforeSolverInitialization,true);
  }
  assert.equal(run.configuration.sharedCacheCapacity,134217728);
  assert.equal(run.configuration.localCacheCapacity,33554432);
  assert.equal(run.configuration.workers,4);assert.equal(run.configuration.rootFrontier,false);
  assert.equal(run.configuration.sharedSampleMask,0);
  assert.deepEqual(run.configuration.policies,['center','live','center','live']);
  assert.equal(run.runtime.node,'v27.0.0-nightly20260928b59840b593');
  assert.equal(run.runtime.v8,'14.6.202.34-node.36');
  assert.equal(invocation.executable_hash,'2f2843c1802f6a17ba7fabe5550c90bb055c9bef8738a08338d94f71dbe91f29');
  assert.equal(run.preparedTiming.readyWorkers,4);assert.equal(run.preparedTiming.rootConstructedAfterReady,true);
  const entryBytes=name.includes('native32')?32:40;
  assert.equal(run.configuration.sharedTtBytes,134217728*entryBytes);
  return {name,sourceCommit:invocation.upstream_commit,entryBytes,wallMs:run.wallMs,
    wholeOperationCycles:Number(run.processCycles),initializationMs:run.preparedTiming.initializationMs,
    cleanupMs:run.preparedTiming.cleanupMs,peakRss:measurement.peak_rss_bytes,
    exact:true,cleanup:true,target10Seconds:run.wallMs<=10000,
    exitStatus:measurement.exit_status,outerPerformanceConclusionAllowed:measurement.performance_conclusion_allowed};
});
function mean(names,field){const items=rows.filter(r=>names.includes(r.name));return items.reduce((s,r)=>s+r[field],0)/items.length;}
const controls=['a-fix-bound40-01','a-fix-bound40-02'],native=['a-fix-native32-01','a-fix-native32-02'];
const comparison={controlMeanMs:mean(controls,'wallMs'),nativeMeanMs:mean(native,'wallMs'),
  controlMeanCycles:mean(controls,'wholeOperationCycles'),nativeMeanCycles:mean(native,'wholeOperationCycles')};
comparison.wallImprovementPercent=100*(1-comparison.nativeMeanMs/comparison.controlMeanMs);
comparison.cycleImprovementPercent=100*(1-comparison.nativeMeanCycles/comparison.controlMeanCycles);
writeFileSync(new URL('PERFORMANCE.json',import.meta.url),JSON.stringify({rows,comparison,
  qualification:'Bounded internal localhost qualification; no statistical/universal speed guarantee.',
  boundaries:'Primary wall: ready empty application to exact result, including root construction. Cycles: whole operation including init and cleanup.',
  legacyWrapper:'Exit 3 means exact result exceeded 10s objective. Historical outer performance_conclusion_allowed=false retained verbatim; this expressly authorized localhost protocol governs this comparison.'},null,2)+'\n');
console.log(JSON.stringify({rows,comparison},null,2));
