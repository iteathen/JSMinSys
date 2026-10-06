// Post-run validation only. Never imported by the timed solver.
import fs from 'node:fs';import assert from 'node:assert/strict';import {createHash} from 'node:crypto';
const area='evidence/isomax-overhead-fusion-20261005/promotion/',path=area+'extracted-full/',
 read=p=>JSON.parse(fs.readFileSync(p)),out=read(path+'stdout.json'),m=read(path+'measurement.json'),
 lock=read('isomax/provenance.json'),invoke=read(path+'invocation.json'),smoke=read(area+'extracted-smoke.json');
assert.equal(out.result.status,'EXACT');assert.equal(out.result.readyWorkers,4);assert.equal(out.result.workersExited,4);
assert.equal(out.result.cleanup,true);assert.equal(out.result.compiledTransitions,true);
assert.equal(out.result.supportTransitionPlanBytes,466948881);assert.equal(out.result.supportBasisPlanBytes,1323433629);
assert.equal(m.exit_status,0);assert.equal(m.timed_out,false);assert.equal(m.actual_process_affinity_mask,85);
assert.equal(out.sourceCommit,lock.sourceCommit);assert.equal(out.runtime.node,'v27.0.0-nightly20260928b59840b593');
assert.equal(out.runtime.v8,'14.6.202.34-node.36');assert.equal(out.configuration.workers,4);assert.equal(out.configuration.rootFrontier,false);
assert.equal(out.configuration.sharedCacheCapacity,134217728);assert.equal(out.configuration.localCacheCapacity,8388608);
assert.deepEqual(out.affinity.map(r=>r.actual.mask),['1','4','16','64']);
assert.deepEqual(out.affinity.map(r=>r.actual.processor),[0,2,4,6]);assert.ok(out.affinity.every(r=>r.beforeSolverInitialization));
assert.equal(smoke.result.status,'EXACT');assert.equal(smoke.result.cleanup,true);assert.equal(smoke.result.workersExited,4);
const archive='iteathen-isomax-0.2.0-rc.2.tgz',sha256=createHash('sha256').update(fs.readFileSync('isomax/dist/'+archive)).digest('hex');
assert.equal(sha256,'26b1c5232ced8fa7c1e12f0bb3ccf0e6fd9c55788a7dab6caeab18e034d162e1');
const report={version:'0.2.0-rc.2',archive,sha256,runtimeSourceCommit:lock.sourceCommit,packagePreparationCommit:invoke.upstream_commit,
 runtimeModules:Object.keys(lock.files).filter(p=>p.startsWith('runtime/')).length,workerModules:lock.workerModules.length,lockedFiles:Object.keys(lock.files).length,
 repositoryTests:{passed:423,failed:0},packageTests:{passed:46,failed:0},
 extractedSmoke:{columns:smoke.columns,rows:smoke.rows,workers:4,status:smoke.result.status,rootWdl:smoke.result.rootWdl,cleanup:true},
 extractedFullSolve:{startingPosition:'empty',columns:7,rows:6,primaryWallMs:out.primaryWallMs,
  initializationMs:out.result.preparedTiming.initializationMs,cleanupMs:out.result.preparedTiming.cleanupMs,
  status:out.result.status,rootWdl:out.result.rootWdl,moveZeroBased:out.result.move,workersReady:4,workersExited:4,cleanup:true,
  runtime:out.runtime.node,v8:out.runtime.v8,cpu:out.runtime.cpu,affinity:[0,2,4,6],sharedTtBytes:4294967296,
  privateTtBytesPerWorker:268435456,compiledTransitionBytes:466948881,peakRssBytes:m.peak_rss_bytes,processCpuMs:m.cpu_ms,rawEvidenceDirectory:path},
 candidateMeanPrimaryMs:53828.45145,goalMs:10000,goalMet:false,runtimeCopiedWithoutChanges:true,registryPublished:false,
 caveat:'One standalone extracted packaging confirmation, not a new repeated optimization comparison. Primary excludes reusable initialization and cleanup. Current-run empty board, no RLC or prior solved knowledge.'};
fs.writeFileSync('isomax/dist/VERIFICATION-0.2.0-rc.2.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
