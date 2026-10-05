// Offline only: native metrics stay native and are never solver inputs.
import {readFileSync,writeFileSync} from 'node:fs';
const root=new URL('../minimal-worker-localhost-20261004/',import.meta.url),records=[];
const args=process.argv.slice(2),localCapacity=Number(args.find(a=>a.startsWith('--local-capacity='))?.split('=')[1]??33554432),
 output=args.find(a=>a.startsWith('--output='))?.split('=')[1]??'COMPARISON.json';
if(!Number.isSafeInteger(localCapacity)||localCapacity<1||!/^[-a-zA-Z0-9]+\.json$/.test(output))throw Error('Invalid offline comparison options');
for(const name of args.filter(a=>!a.startsWith('--'))){
 const dir=new URL(name+'/',root),load=f=>JSON.parse(readFileSync(new URL(f,dir),'utf8')),
  solve=load('stdout.json'),os=load('measurement.json'),invoke=load('invocation.json'),cleanup=load('cleanup-verification.json'),
  affinity=[0,1,2,3].map(i=>load(`affinity-${i}.json`));
 if(solve.status!=='EXACT'||solve.errorCode||!solve.cleanup||solve.workersExited!==4||os.timed_out||os.metric_error||!cleanup.clean)
  throw Error('Incomplete run: '+name);
 const c=solve.configuration;
 if(c.workers!==4||c.sharedCacheCapacity!==134217728||c.localCacheCapacity!==localCapacity||c.rootFrontier!==false||c.sharedSampleMask!==0||
  JSON.stringify(c.policies)!==JSON.stringify(['center','live','center','live'])||
  solve.runtime.node!=='v27.0.0-nightly20260928b59840b593'||os.actual_process_affinity_mask!==85||
  affinity.some((a,i)=>!a.beforeSolverInitialization||a.actual.processor!==i*2||a.actual.group!==0))throw Error('Configuration drift: '+name);
 records.push({name,commit:invoke.upstream_commit,solveMs:solve.wallMs,cycles:solve.processCycles,
  peakRssBytes:os.peak_rss_bytes,initializationMs:solve.preparedTiming.initializationMs,
  cleanupMs:solve.preparedTiming.cleanupMs,wholeOperationMs:solve.totalOperationWallMs,
  rootWdl:solve.rootWdl,move:solve.move,winner:solve.winner,configuration:c,
  exact:true,cleanup:true,affinityVerified:true,targetMet:solve.wallMs<=10000,
  rawPerformanceConclusionAllowed:os.performance_conclusion_allowed,
  cycleBoundary:solve.processCycleBoundary,rawDirectory:name});
}
writeFileSync(new URL(output,import.meta.url),JSON.stringify({records,
 caveat:'Completed localhost controlled comparisons only; no statistical confidence interval. Whole-operation cycles include initialization/cleanup. Null hot statistics are unavailable, not zero. Raw target flag is preserved; missing10s does not invalidate an exact completed relative trial.'},null,2)+'\n');
console.log(records.map(r=>({name:r.name,seconds:r.solveMs/1000,cycles:r.cycles,peakGiB:r.peakRssBytes/2**30})));
