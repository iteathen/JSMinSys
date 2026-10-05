import {prepareConnect4RbaGeometry, runLazySmpConnect4Rba32, evaluateConnect4RankLocalLanding32} from '../../../isomax/index.mjs';
const geometry=prepareConnect4RbaGeometry({columns:1,rows:1});
for(const timeoutMs of [10000,2147483648]) {
  const result=await runLazySmpConnect4Rba32([],{geometry,workers:2,sharedCacheCapacity:16,localCacheCapacity:16,timeoutMs});
  console.log(JSON.stringify({timeoutMs,status:result.status,elapsedMs:result.elapsedMs,errorCode:result.errorCode,cleanup:result.cleanup}));
}
try {
  const r=evaluateConnect4RankLocalLanding32(new DataView(new ArrayBuffer(4)), {geometry:prepareConnect4RbaGeometry({columns:7,rows:6})});
  console.log(JSON.stringify({input:'DataView',accepted:true,status:r.status,move:r.move,rank:r.rank}));
} catch(error) { console.log(JSON.stringify({input:'DataView',accepted:false,error:String(error)})); }
