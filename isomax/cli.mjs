import {cpus} from 'node:os';
import {performance} from 'node:perf_hooks';
import {readFileSync} from 'node:fs';
import {prepareConnect4RbaGeometry,prepareLazySmpConnect4Rba32,profile,ISOMAX_MEMORY_PROFILES} from './index.mjs';
const args=process.argv.slice(2),v={columns:7,rows:6,workers:'auto','timeout-ms':600000,'memory-profile':'auto','shared-entries':undefined,'local-entries':undefined};
if(args.includes('--list-memory-profiles'))console.log(JSON.stringify(ISOMAX_MEMORY_PROFILES,null,2));
else if(args.includes('--help'))console.log('IsoMax exact empty-board solve. Workers and memory profile are discovered at initialization.\nnode run.mjs [--workers auto|N] [--memory-profile auto|1|2|4|8|16|32|64|128] [--columns N] [--rows N] [--timeout-ms N]\nnode run.mjs --list-memory-profiles\nExplicit cache entries override auto: --shared-entries N --local-entries N\nProfiles1/2/4/8GiB tested;16/32/64/128GiB experimental. Auto chooses the largest fitting profile, including experimental. Private TT budget256MiB/worker, plus support/runtime reserve. Node>=26.7.');
else try{
 for(let i=0;i<args.length;i+=2){const k=args[i].replace(/^--/,'');if(!args[i].startsWith('--')||!Object.hasOwn(v,k))throw Error('Invalid option: '+args[i]);if((k==='workers'||k==='memory-profile')&&args[i+1]==='auto'){v[k]='auto';continue;}if(k==='memory-profile'){if(!ISOMAX_MEMORY_PROFILES.some(p=>p.id===args[i+1]))throw Error('Invalid memory profile');v[k]=args[i+1];continue;}if(!/^\d+$/.test(args[i+1]??''))throw Error('Invalid option: '+args[i]);v[k]=Number(args[i+1]);if(!Number.isSafeInteger(v[k])||v[k]<1)throw Error('Invalid positive integer: '+k);}
 const started=performance.now(),geometry=prepareConnect4RbaGeometry({columns:v.columns,rows:v.rows}),
  app=await prepareLazySmpConnect4Rba32({geometry,workers:v.workers,memoryProfile:v['memory-profile'],timeoutMs:v['timeout-ms'],
   ...(v['shared-entries']!==undefined?{sharedCacheCapacity:v['shared-entries']}:{ }),...(v['local-entries']!==undefined?{localCacheCapacity:v['local-entries']}:{ })});
 if(app.memoryPlan.profile.status==='experimental')console.error('Experimental memory profile selected: '+app.memoryPlan.profile.id+'GiB. Full-capacity performance is unqualified.');
 let result;try{result=await app.solve([]);}finally{await app.close();}
 const affinity=process.env.JMS_WORKER_AFFINITY_REPORT?Array.from({length:app.workerPlan.workers},(_,i)=>JSON.parse(readFileSync(process.env.JMS_WORKER_AFFINITY_REPORT+'-'+i+'.json','utf8'))):null;
 console.log(JSON.stringify({packageVersion:profile.version,sourceCommit:profile.sourceCommit,startingPosition:'empty',columns:v.columns,rows:v.rows,runtime:{node:process.version,v8:process.versions.v8,cpu:cpus()[0]?.model},workerPlan:app.workerPlan,memoryPlan:app.memoryPlan,affinity,configuration:{...profile.options,workers:app.workerPlan.workers,sharedCacheCapacity:app.memoryPlan.sharedCacheCapacity,localCacheCapacity:app.memoryPlan.localCacheCapacity,sharedCacheLayout:app.memoryPlan.sharedCacheLayout,localCacheLayout:app.memoryPlan.localCacheLayout,timeoutMs:v['timeout-ms']},primaryWallMs:result.preparedTiming.solveMs,operationWallMs:performance.now()-started,memory:process.memoryUsage(),result},null,2));
 process.exitCode=result.status==='EXACT'?0:2;
}catch(error){console.error(error.stack);process.exitCode=1;}
