import {readFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {prepareConnect4RbaGeometry,evaluateConnect4RankLocalLanding32,runLazySmpConnect4Rba32} from './index.mjs';
const profile=JSON.parse(readFileSync(new URL('./profile.json',import.meta.url)));
const geometry=prepareConnect4RbaGeometry(profile.geometry),moves=[],trace=[];
const start=performance.now();
// One pre-search phase, computed from actual positions. No stored opening.
while(true){
  const local=evaluateConnect4RankLocalLanding32(moves,{geometry});
  trace.push({sequence:moves.map(c=>c+1).join(''),...local});
  if(local.status!=='CERTIFIED')break;
  moves.push(local.move);
}
const result=await runLazySmpConnect4Rba32(moves,{geometry,...profile.options});
console.log(JSON.stringify({structuralMoves:moves.length,searchRoot:moves.map(c=>c+1).join(''),
  firstSearchPly:moves.length+1,searchCalls:1,trace,...result,wallMs:performance.now()-start},null,2));
if(result.status!=='EXACT')process.exitCode=1;
