// Cold harness; no measurement callback is inserted into recursion.
import {performance} from 'node:perf_hooks';
import {runTrial} from './host.mjs';
import {processCycleCounter} from '../cpc-factorial/cycle-counter.mjs';
const config=JSON.parse(process.argv[2]),root=process.argv[3];
if(config.strategy)process.env.JSMINSYS_STRATEGIST_POLICY=config.strategy;
else delete process.env.JSMINSYS_STRATEGIST_POLICY;
delete process.env.JSMINSYS_FLAG_DISPATCH;
const meter=await processCycleCounter(),before=meter.read(),started=performance.now();
try{
  const result=await runTrial({fixture:{columns:7,rows:6,moves:[...root].map(Number)},
    ...config,warmups:20,measureCycles:true,cadenceMs:5});
  const after=meter.read();
  console.log(JSON.stringify({...result,config,root,trialWallMs:performance.now()-started,
    processTotalCycles:String(after),trialProcessCycles:String(after-before)}));
}finally{meter.close();}
