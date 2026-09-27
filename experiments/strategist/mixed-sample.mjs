// COLD sample process. Preserve the existing warmed barrier and worker machinery.
import {performance} from 'node:perf_hooks';
import {runTrial} from './host.mjs';
import {processCycleCounter} from '../cpc-factorial/cycle-counter.mjs';
const [label,key]=process.argv.slice(2);
const roots={A:'2053635233350500',B:'1320461024522311',F:'34350556'};
if(!['modes-deep','modes-wide-helper','modes-wide-anchor'].includes(label)||!roots[key])throw Error('sample arguments');
process.env.JSMINSYS_STRATEGIST_POLICY=label;
delete process.env.JSMINSYS_FLAG_DISPATCH;
const meter=await processCycleCounter(),before=meter.read(),start=performance.now();
try{
  const r=await runTrial({fixture:{columns:7,rows:6,moves:[...roots[key]].map(Number)},workers:2,policy:'inert',
    timeoutMs:750,warmups:20,measureCycles:true,localCapacity:4096,sharedCapacity:16384,cadenceMs:5});
  const after=meter.read(),trialWallMs=performance.now()-start;
  console.log(JSON.stringify({label,key,...r,expectedValue:key==='F'?3:1,trialWallMs,
    processTotalCycles:String(after),trialProcessCycles:String(after-before),
    processAgeAtReturnMs:performance.now(),
    costBoundary:'Process cycles include cold preparation/warmup/search/join and all runtime threads; evaluator cycles cover solve through cooperative return.'}));
}finally{meter.close();}
