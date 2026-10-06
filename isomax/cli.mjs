import {cpus} from 'node:os';
import {performance} from 'node:perf_hooks';
import {readFileSync} from 'node:fs';
import {prepareConnect4RbaGeometry,prepareLazySmpConnect4Rba32,profile} from './index.mjs';
const args=process.argv.slice(2),v={columns:7,rows:6,'timeout-ms':600000,'shared-entries':profile.options.sharedCacheCapacity,'local-entries':profile.options.localCacheCapacity};
if(args.includes('--help'))console.log('IsoMax exact empty-board solve, four workers.\nnode run.mjs [--columns N] [--rows N] [--timeout-ms N] [--shared-entries N] [--local-entries N]\nDefaults:7x6,4GiB shared TT,256MiB private TT/worker. Node>=26; no installation needed.');
else try{
 for(let i=0;i<args.length;i+=2){const k=args[i].replace(/^--/,'');if(!args[i].startsWith('--')||!Object.hasOwn(v,k)||!/^\d+$/.test(args[i+1]??''))throw Error('Invalid option: '+args[i]);v[k]=Number(args[i+1]);if(!Number.isSafeInteger(v[k])||v[k]<1)throw Error('Invalid positive integer: '+k);}
 const started=performance.now(),geometry=prepareConnect4RbaGeometry({columns:v.columns,rows:v.rows}),app=await prepareLazySmpConnect4Rba32({geometry,timeoutMs:v['timeout-ms'],sharedCacheCapacity:v['shared-entries'],localCacheCapacity:v['local-entries']});
 let result;try{result=await app.solve([]);}finally{await app.close();}
 const affinity=process.env.JMS_WORKER_AFFINITY_REPORT?Array.from({length:4},(_,i)=>JSON.parse(readFileSync(process.env.JMS_WORKER_AFFINITY_REPORT+'-'+i+'.json','utf8'))):null;
 console.log(JSON.stringify({packageVersion:'0.2.0-rc.1',sourceCommit:profile.sourceCommit,startingPosition:'empty',columns:v.columns,rows:v.rows,runtime:{node:process.version,v8:process.versions.v8,cpu:cpus()[0]?.model},affinity,configuration:{...profile.options,sharedCacheCapacity:v['shared-entries'],localCacheCapacity:v['local-entries'],timeoutMs:v['timeout-ms']},primaryWallMs:result.preparedTiming.solveMs,operationWallMs:performance.now()-started,memory:process.memoryUsage(),result},null,2));
 process.exitCode=result.status==='EXACT'?0:2;
}catch(error){console.error(error.stack);process.exitCode=1;}
