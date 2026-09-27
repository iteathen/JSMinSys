// COLD experiment only: unchanged host, workers, observation and TT.
import {performance} from 'node:perf_hooks';
import {runTrial} from './host.mjs';
import {processCycleCounter} from '../cpc-factorial/cycle-counter.mjs';
import locked from '../worker-scaling/locked-profile.json' with {type:'json'};
const c=JSON.parse(process.argv[2]);
if(c.trigger==='native')delete process.env.JSMINSYS_STRATEGIST_POLICY;
else process.env.JSMINSYS_STRATEGIST_POLICY=c.trigger==='read'?'modes-pending-band-read':'modes-pending-band';
process.env.JSMINSYS_PENDING_TRIGGER=['native','read'].includes(c.trigger)?'sustained':c.trigger;
delete process.env.JSMINSYS_FLAG_DISPATCH;
const meter=await processCycleCounter(),before=meter.read(),start=performance.now();
try{
  const r=await runTrial({fixture:{columns:7,rows:6,moves:[...c.root].map(Number)},workers:c.workers,
    policy:c.trigger==='native'?'host-only':'inert',timeoutMs:750,warmups:20,cadenceMs:5,measureCycles:true,
    localCapacity:locked.options.localCacheCapacity,sharedCapacity:locked.options.sharedCacheCapacity});
  const after=meter.read();
  console.log(JSON.stringify({...r,config:c,trialWallMs:performance.now()-start,
    trialProcessCycles:String(after-before),processTotalCycles:String(after),processAgeAtReturnMs:performance.now()}));
}finally{meter.close();}
