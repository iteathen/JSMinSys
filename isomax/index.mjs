// Cold boundary; the frozen worker/search kernels are unchanged.
import {readFileSync} from 'node:fs';
import {prepareConnect4RbaGeometry} from './runtime/addons/rba-connect4-geometry.mjs';
import {prepareLazySmpConnect4Rba32 as prepareRaw} from './runtime/addons/rba-connect4-prepared-session-host.mjs';
export {prepareConnect4RbaGeometry};
export {evaluateConnect4RankLocalLanding32} from './runtime/addons/connect4-rank-local-presearch.mjs';
export const profile=JSON.parse(readFileSync(new URL('./profile.json',import.meta.url),'utf8'));
export async function prepareLazySmpConnect4Rba32(options={}){
 if(options.signal?.aborted)throw new Error('preparation aborted');
 return prepareRaw({...profile.options,...options,geometry:options.geometry??prepareConnect4RbaGeometry({columns:7,rows:6})});
}
export async function runLazySmpConnect4Rba32(moves=[],options={}){
 const app=await prepareLazySmpConnect4Rba32(options);
 try{return await app.solve(moves);}finally{await app.close();}
}
