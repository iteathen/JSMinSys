// Offline evidence reader only. Never loaded by a timed solver.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const root=new URL('./',import.meta.url),read=p=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const groups={control:['c15-off-01','c15-restored-control-02'],idle:['c15-idle-01'],async:['c15-async-01','c15-async-02'],dedup:['c15b-dedup-01','c15b-dedup-02'],changedWords:['c15c-delta-01','c15c-delta-02']};
const runs=[];
for(const [group,names] of Object.entries(groups))for(const name of names){
 const result=read(name+'/stdout.json'),os=read(name+'/measurement.json'),invocation=read(name+'/invocation.json'),cleanup=read(name+'/cleanup-verification.json'),helper=group==='control'?0:1;
 assert.equal(result.status,'EXACT');assert.equal(result.rootWdl,1);assert.equal(result.move,3);
 assert.equal(result.cleanup,true);assert.equal(cleanup.clean,true);assert.equal(cleanup.remainingBenchmarkProcesses.length,0);
 assert.equal(result.workersExited,4+helper);assert.equal(result.preparedTiming.readyWorkers,4);
 assert.equal(result.configuration.sharedCacheCapacity,134217728);assert.equal(result.configuration.localCacheCapacity,33554432);
 assert.equal(result.configuration.rootFrontier,false);assert.equal(result.configuration.sharedSampleMask,0);
 assert.deepEqual(result.configuration.policies,['center','live','center','live']);
 assert.equal(os.timed_out,false);assert.equal(os.affinity_error,null);assert.equal(os.metric_error,null);
 assert.equal(os.actual_process_affinity_mask,helper?4181:85);assert.equal(os.exit_status,3);
 assert.equal(result.runtime.node,'v27.0.0-nightly20260928b59840b593');assert.equal(result.runtime.v8,'14.6.202.34-node.36');
 for(const flag of ['--max-inlined-bytecode-size=600','--max-inlined-bytecode-size-cumulative=2400'])assert.ok(invocation.arguments.includes(flag));
 const affinity=[];
 for(let i=0;i<4+helper;i++){
  const row=read(name+'/affinity-'+i+'.json'),cpu=i===4?12:i*2;
  assert.equal(row.actual.processor,cpu);assert.equal(row.actual.group,0);assert.equal(row.beforeSolverInitialization,true);
  assert.equal(row.target.efficiency,i===4?0:1);affinity.push(cpu);
 }
 runs.push({name,group,sourceCommit:invocation.upstream_commit,exactCommand:{executable:invocation.executable,arguments:invocation.arguments,environment:invocation.environment},runtimeHash:invocation.executable_hash,wallMs:result.wallMs,initializationMs:result.preparedTiming.initializationMs,cleanupMs:result.preparedTiming.cleanupMs,entireOperationCycles:result.processCycles,cpuMs:os.cpu_ms,peakRssBytes:os.peak_rss_bytes,affinity,status:'EXACT_OVER_10S_TARGET',cleanup:true});
}
const summaries={};
for(const group of Object.keys(groups)){
 const rows=runs.filter(r=>r.group===group),mean=k=>rows.reduce((s,r)=>s+Number(r[k]),0)/rows.length;
 summaries[group]={runs:rows.length,meanWallMs:mean('wallMs'),meanEntireOperationCycles:mean('entireOperationCycles'),meanCpuMs:mean('cpuMs'),maxPeakRssBytes:Math.max(...rows.map(r=>r.peakRssBytes))};
}
for(const group of Object.keys(groups)){
 const s=summaries[group],b=summaries.control;
 s.wallChangePercent=(s.meanWallMs/b.meanWallMs-1)*100;s.cycleChangePercent=(s.meanEntireOperationCycles/b.meanEntireOperationCycles-1)*100;
 s.disposition=group==='control'?'RETAINED':group==='idle'?'CONTROL_ONLY':'NOT_RETAINED_TOTAL_COST';
}
const report={kind:'C15-localhost-complete-empty-solve-comparison',sourceRestoredTo:'a566296',timingBoundary:'all reusable initialization complete -> construct actual empty root -> exact result; cycles include initialization and cleanup across all threads',configuration:{sharedEntries:134217728,privateEntriesPerWorker:33554432,searchWorkers:4,policies:['center','live','center','live'],searchCpus:[0,2,4,6],helperCpu:12,helperQueueBytes:10486276},limitations:['Small run counts; no statistical or universal performance claim.','Native node/shared counters intentionally absent.','Raw external-wrapper performance_conclusion_allowed flag is inherited metadata; current localhost warrant governs this separately authorized experiment.','E-core parent hypothesis not falsified by these publication implementations.'],summaries,runs};
fs.writeFileSync(new URL('C15-COMPARISON.json',root),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(summaries,null,2));
