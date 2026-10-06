// Cold boundary; the frozen worker/search kernels are unchanged.
import {readFileSync} from 'node:fs';
import {prepareConnect4RbaGeometry} from './runtime/addons/rba-connect4-geometry.mjs';
import {prepareLazySmpConnect4Rba32 as prepareRaw} from './runtime/addons/rba-connect4-prepared-session-host.mjs';
import {discoverWorkerPlan} from './runtime/addons/worker-topology.mjs';
export {discoverWorkerPlan};
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
 const app=await prepareRaw({...profile.options,...options,workers:workerPlan.workers,workerTargets:workerPlan.targets,geometry:options.geometry??prepareConnect4RbaGeometry({columns:7,rows:6})});
 if(app.state().readyWorkers!==workers||!app.state().affinityReady||app.state().closed){await app.close();throw new Error('Worker affinity initialization failed: '+app.state().errors.join('\n'));}
 return {...app,workerPlan:Object.freeze(workerPlan)};
}
export async function runLazySmpConnect4Rba32(moves=[],options={}){
 const app=await prepareLazySmpConnect4Rba32(options);
 try{return await app.solve(moves);}finally{await app.close();}
}
