import {prepareConnect4RbaGeometry} from 'file:///C:/r/jsminsys-cpc-rebuild-20261004/addons/rba-connect4-geometry.mjs';
import {runLazySmpConnect4Rba32} from 'file:///C:/r/jsminsys-cpc-rebuild-20261004/addons/rba-connect4-lazy-smp-host.mjs';
const result=await runLazySmpConnect4Rba32([],{geometry:prepareConnect4RbaGeometry({columns:4,rows:3}),workers:4,workerMode:'minimal',publicationMode:'async',sharedCacheCapacity:4096,localCacheCapacity:4096,preparedEmptyTiming:true,timeoutMs:10000});
console.log(JSON.stringify(result,null,2));
if(result.status!=='EXACT'||result.workersExited!==5||!result.cleanup)process.exitCode=1;
