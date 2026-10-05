import fs from 'node:fs';
import {createManagedThreadSession32} from '../../../addons/branch-manager-host.mjs';
import {createConnect4RbaSharedExactCache32} from '../../../addons/rba-connect4-shared-exact-cache.mjs';
import {prepareConnect4RbaGeometry} from '../../../addons/rba-connect4-geometry.mjs';
import {runLazySmpConnect4Rba32} from '../../../addons/rba-connect4-lazy-smp-host.mjs';
const rows=[];
for(let trial=0;trial<3;trial++){
  const control=new Int32Array(new SharedArrayBuffer(20));control[1]=1;
  const session=createManagedThreadSession32({control,stopIndex:0,doneIndex:1,errorIndex:2,wakeIndex:3,workerDiedCode:101,deadlineCode:102,cancelledCode:103});
  const errorCode=await session.wait({timeoutMs:1,pollMs:100});
  await session.close();rows.push({case:'already-completed-session',trial,doneBeforeWait:true,errorCode,state:session.state()});
}
for(const capacity of [4294967297,4294967298,9007199254740992]){
  const original=globalThis.SharedArrayBuffer;let allocatedBytes=null,error;
  try{
    globalThis.SharedArrayBuffer=class {constructor(bytes){allocatedBytes=bytes;throw Error('AUDIT_ALLOCATION_BLOCKED');}};
    createConnect4RbaSharedExactCache32({capacity,keyWords:1});
  }catch(e){error=e.message;}finally{globalThis.SharedArrayBuffer=original;}
  rows.push({case:'invalid-capacity-with-no-real-allocation',capacity,integer:Number.isInteger(capacity),bitwisePowerTest:capacity&(capacity-1),allocatedBytes,error});
}
const geometry=prepareConnect4RbaGeometry({columns:4,rows:3});
try{
  const actual=await runLazySmpConnect4Rba32([],{geometry,workers:4,workerMode:'minimal',preparedEmptyTiming:true,signal:AbortSignal.abort(),sharedCacheCapacity:4096,localCacheCapacity:4096,timeoutMs:1000});
  rows.push({case:'pre-aborted-prepared-empty',result:actual});
}catch(e){rows.push({case:'pre-aborted-prepared-empty',exception:e.message});}
fs.writeFileSync(new URL('../raw/host-repros.json',import.meta.url),JSON.stringify({node:process.version,v8:process.versions.v8,rows},null,2));
console.log(JSON.stringify(rows,null,2));
