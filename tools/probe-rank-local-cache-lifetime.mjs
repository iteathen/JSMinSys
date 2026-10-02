// Cold measurement probe only: test collection of unreachable per-call shared TT.
import fs from 'node:fs';
import path from 'node:path';
import v8 from 'node:v8';
import vm from 'node:vm';
import {setImmediate as turn} from 'node:timers/promises';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {runIsoMaxConnect4Move32} from '../addons/rba-connect4-move-selector.mjs';
const out=path.resolve(process.argv[2]);fs.mkdirSync(out,{recursive:true});
v8.setFlagsFromString('--expose_gc');const collect=vm.runInNewContext('gc');
process.env.JMS_WORKER_AFFINITY_FILE=path.resolve('evidence/isomax-memory-affinity-20260928/targets.json');
const geometry=prepareConnect4RbaGeometry({columns:7,rows:6});
const config={geometry,workers:4,rootFrontier:true,sharedSampleMask:0,sharedCacheCapacity:268435456,localCacheCapacity:16777216,timeoutMs:300000};
const evidence={purpose:'Measure pending collection, not performance or solver outcome',runtime:process.version,before:process.memoryUsage(),calls:[]};
for(let i=0;i<2;i++){
  process.env.JMS_WORKER_AFFINITY_REPORT=path.join(out,'probe-'+i+'-affinity');
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),4000),row={index:i,before:process.memoryUsage()};
  try{const r=await runIsoMaxConnect4Move32([3,3,3,3,3],{...config,signal:controller.signal});row.result=r;}catch(e){row.error={message:e.message,stack:e.stack};}finally{clearTimeout(timer);}
  row.afterReturn=process.memoryUsage();collect();await turn();collect();await turn();row.afterCollection=process.memoryUsage();evidence.calls.push(row);
  fs.writeFileSync(path.join(out,'lifetime.json'),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify({index:i,status:row.result?.status,error:row.error?.message,before:row.before.arrayBuffers,afterReturn:row.afterReturn.arrayBuffers,afterCollection:row.afterCollection.arrayBuffers}));
}
