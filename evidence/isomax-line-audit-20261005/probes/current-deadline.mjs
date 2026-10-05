import {prepareConnect4RbaGeometry} from '../../../addons/rba-connect4-geometry.mjs';
import {runLazySmpConnect4Rba32} from '../../../addons/rba-connect4-lazy-smp-host.mjs';
const geometry=prepareConnect4RbaGeometry({columns:1,rows:1});
for(const timeoutMs of [10000,2147483648]){
  const result=await runLazySmpConnect4Rba32([],{geometry,workers:4,workerMode:'minimal',sharedCacheCapacity:16,localCacheCapacity:16,timeoutMs});
  console.log(JSON.stringify({timeoutMs,status:result.status,errorCode:result.errorCode,elapsedMs:result.elapsedMs,cleanup:result.cleanup,workersExited:result.workersExited}));
}
