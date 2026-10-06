// Cold boundary; the frozen worker/search kernels are unchanged.
import {readFileSync} from 'node:fs';
import {prepareConnect4RbaGeometry} from './runtime/addons/rba-connect4-geometry.mjs';
import {prepareLazySmpConnect4Rba32 as prepareRaw} from './runtime/addons/rba-connect4-prepared-session-host.mjs';
import {discoverWorkerPlan} from './runtime/addons/worker-topology.mjs';
import {ISOMAX_MEMORY_PROFILES,discoverAvailableSolverMemory32,selectIsoMaxMemoryProfile32,estimateIsoMaxPreparationReserve32} from './runtime/addons/isomax-memory-profile.mjs';
import {prepareSharedCacheLayout,isCompactLayoutProfile8} from './runtime/addons/rba-connect4-shared-exact-cache-layout.mjs';
export {discoverWorkerPlan};
export {ISOMAX_MEMORY_PROFILES,discoverAvailableSolverMemory32,selectIsoMaxMemoryProfile32};
export {prepareConnect4RbaGeometry};
export {evaluateConnect4RankLocalLanding32} from './runtime/addons/connect4-rank-local-presearch.mjs';
export const profile=JSON.parse(readFileSync(new URL('./profile.json',import.meta.url),'utf8'));
export async function prepareLazySmpConnect4Rba32(options={}){
 if(options.signal?.aborted)throw new Error('preparation aborted');
 const requested=options.workers??'auto';
 if(requested!=='auto'&&(!Number.isInteger(requested)||requested<2||requested>64))throw new RangeError('IsoMax requires 2..64 search workers');
 const detected=await discoverWorkerPlan(),workers=requested==='auto'?detected.workers:requested;
 if(!Number.isInteger(workers)||workers<2||workers>64)throw new RangeError('IsoMax requires 2..64 search workers');
 if(!detected.targets?.length||workers>detected.targets.length)throw new RangeError('Requested workers exceed available physical CPU targets');
 const workerPlan={...detected,workers,selection:requested==='auto'?detected.selection:'explicit',targets:detected.targets.slice(0,workers),
  affinityRequired:detected.platform!=='darwin',affinityPolicy:detected.platform==='darwin'?'macos-hints':'verified-pinning'};
 if(options.signal?.aborted)throw new Error('preparation aborted');
 const geometry=options.geometry??prepareConnect4RbaGeometry({columns:7,rows:6}),snapshot=await discoverAvailableSolverMemory32(),
  memoryRequested=options.memoryProfile??profile.options.memoryProfile,
  custom=Object.hasOwn(options,'sharedCacheCapacity')||Object.hasOwn(options,'localCacheCapacity'),
  reserveBytes=estimateIsoMaxPreparationReserve32({...profile.options,...options,geometry,workers});
 let memoryPlan,config={...profile.options,...options,geometry,workers:workerPlan.workers,workerTargets:workerPlan.targets};
 if(custom){
  if(memoryRequested!=='auto')throw RangeError('Choose a memory profile or explicit cache capacities');
  const compact=isCompactLayoutProfile8(geometry,geometry.keyWords),layout=prepareSharedCacheLayout(geometry,geometry.keyWords);
  config={...profile.explicitCacheDefaults,...config};
  const native=config.sharedCacheLayout==='native'||(config.sharedCacheLayout==='auto'&&compact&&config.sharedCacheCapacity<=2**27),
   sharedBytes=config.sharedCacheCapacity*(native?layout.entryBytes:((compact?8:geometry.keyWords)+2)*4),
   privateBytesPerWorker=config.localCacheCapacity*(config.localCacheLayout==='native'&&compact?32:(compact?8:geometry.keyWords)*4+1),
   requiredBytes=sharedBytes+workers*privateBytesPerWorker+reserveBytes;
  if(!Number.isSafeInteger(requiredBytes)||requiredBytes>snapshot.availableBytes)throw RangeError('Insufficient cache memory headroom');
  memoryPlan=Object.freeze({profile:{id:'custom',status:'custom'},selection:'explicit-capacities',sharedCacheCapacity:config.sharedCacheCapacity,
   localCacheCapacity:config.localCacheCapacity,sharedCacheLayout:config.sharedCacheLayout,localCacheLayout:config.localCacheLayout,
   sharedBytes,privateBytesPerWorker,privateBytes:workers*privateBytesPerWorker,reserveBytes,requiredBytes,availableBytes:snapshot.availableBytes,snapshot});
 }else{
  const selected=selectIsoMaxMemoryProfile32({geometry,workers,availableBytes:snapshot.availableBytes,requested:memoryRequested,
   allowExperimental:options.allowExperimentalMemoryProfiles??true,reserveBytes});
  memoryPlan=Object.freeze({...selected,snapshot});
  config={...config,sharedCacheCapacity:selected.sharedCacheCapacity,localCacheCapacity:selected.localCacheCapacity,
   sharedCacheLayout:selected.sharedCacheLayout,localCacheLayout:selected.localCacheLayout,sharedBankCapacity:selected.sharedBankCapacity};
 }
 if(options.signal?.aborted)throw new Error('preparation aborted');
 const app=await prepareRaw(config);
 if(app.state().readyWorkers!==workers||!app.state().affinityReady||app.state().closed){await app.close();throw new Error('Worker affinity initialization failed: '+app.state().errors.join('\n'));}
 return {...app,workerPlan:Object.freeze(workerPlan),memoryPlan};
}
export async function runLazySmpConnect4Rba32(moves=[],options={}){
 const app=await prepareLazySmpConnect4Rba32(options);
 try{return {...await app.solve(moves),memoryPlan:app.memoryPlan};}finally{await app.close();}
}
