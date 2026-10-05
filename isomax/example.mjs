import {readFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {prepareConnect4RbaGeometry,evaluateConnect4RankLocalLanding32,prepareLazySmpConnect4Rba32} from './index.mjs';
const profile=JSON.parse(readFileSync(new URL('./profile.json',import.meta.url)));
const geometry=prepareConnect4RbaGeometry(profile.geometry),moves=[],trace=[];
const app=await prepareLazySmpConnect4Rba32({geometry,...profile.options});
const start=performance.now();
try{
// One pre-search phase, computed from actual positions. No stored opening.
while(true){
  const local=evaluateConnect4RankLocalLanding32(moves,{geometry});
  trace.push({sequence:moves.map(c=>c+1).join(''),...local});
  if(local.status!=='CERTIFIED')break;
  moves.push(local.move);
}
const result=await app.solve(moves);
console.log(JSON.stringify({structuralMoves:moves.length,searchRoot:moves.map(c=>c+1).join(''),
  firstSearchPly:moves.length+1,searchCalls:1,trace,...result,wallMs:performance.now()-start-result.cleanupMs,
  timingScope:'all workers ready -> runtime RLC -> one exact result; initialization and cleanup separate'},null,2));
if(result.status!=='EXACT')process.exitCode=1;
}finally{await app.close();}
