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
 const requested=options.workers??'auto',workerPlan=requested==='auto'?await discoverWorkerPlan():{workers:requested,selection:'explicit'};
 if(!Number.isInteger(workerPlan.workers)||workerPlan.workers<2||workerPlan.workers>64)throw new RangeError('IsoMax requires 2..64 search workers; supply --workers when automatic topology is outside that range');
 if(options.signal?.aborted)throw new Error('preparation aborted');
 const app=await prepareRaw({...profile.options,...options,workers:workerPlan.workers,geometry:options.geometry??prepareConnect4RbaGeometry({columns:7,rows:6})});
 return {...app,workerPlan:Object.freeze(workerPlan)};
}
export async function runLazySmpConnect4Rba32(moves=[],options={}){
 const app=await prepareLazySmpConnect4Rba32(options);
 try{return await app.solve(moves);}finally{await app.close();}
}
