// Cold fresh-process sample; existing solver, host, TT and worker execution.
import {performance} from 'node:perf_hooks';
import {runTrial} from './host.mjs';
import {processCycleCounter} from '../cpc-factorial/cycle-counter.mjs';
const config=JSON.parse(process.argv[2]),root=process.argv[3];
process.env.JSMINSYS_STRATEGIST_POLICY=config.strategy;delete process.env.JSMINSYS_FLAG_DISPATCH;
const meter=await processCycleCounter(),before=meter.read(),started=performance.now();
try{
  const r=await runTrial({fixture:{columns:7,rows:6,moves:[...root].map(Number)},...config,
    policy:'inert',timeoutMs:750,warmups:20,measureCycles:true,cadenceMs:5});
  const after=meter.read();
  console.log(JSON.stringify({...r,config,root,trialWallMs:performance.now()-started,
    processTotalCycles:String(after),trialProcessCycles:String(after-before),processAgeAtReturnMs:performance.now()}));
}finally{meter.close();}
