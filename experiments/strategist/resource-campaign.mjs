import {runTrial} from './host.mjs';
import {appendFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {cpus} from 'node:os';
import assert from 'node:assert/strict';
const [output,stage,roundText='3']=process.argv.slice(2),rounds=Number(roundText);
if(!output||existsSync(output))throw Error('new output path required');
assert.ok(Number.isInteger(rounds)&&rounds>=1&&rounds<=3);
const base={localCapacity:4096,sharedCapacity:16384};
const configurations=stage==='memory'?[
  {label:'base',workers:4,...base},
  {label:'shared-2x',workers:4,...base,sharedCapacity:32768},
  {label:'private-2x',workers:4,...base,localCapacity:8192},
  {label:'both-2x',workers:4,localCapacity:8192,sharedCapacity:32768},
]:stage==='pool'?[1,2,4,8].map(workers=>({label:`workers-${workers}`,workers,...base})):
stage==='activation'?[
  {label:'fixed-1-of-4',workers:4,initialActive:1,...base},
  {label:'fixed-2-of-4',workers:4,initialActive:2,...base},
  {label:'fixed-4-of-4',workers:4,initialActive:4,...base},
  {label:'width-grow-1-to-4',workers:4,initialActive:1,grow:true,...base},
]:null;
assert.ok(configurations,'stage must be memory, pool or activation');
const roots=['2053635233350500','1320461024522311',''];
appendFileSync(output,JSON.stringify({type:'metadata',sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  dirty:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),node:process.version,v8:process.versions.v8,
  cpu:cpus()[0].model,date:new Date().toISOString(),stage,configurations,roots,rounds,timeoutMs:750,warmups:20,cadenceMs:5,
  scope:'Isolated memory/pool/standby activation screens. Sum all evaluator thread cycles (standby gate included); strategist separate. Empty-board TIMEOUT is throughput evidence only. No SHALLOW commands.'})+'\n');
for(let round=0;round<rounds;round++)for(const root of roots)for(let j=0;j<configurations.length;j++){
  const c=configurations[(j+round)%configurations.length];
  process.env.JSMINSYS_STRATEGIST_POLICY=stage==='activation'?(c.grow?'modes-pending-pool-grow':'modes-pending-pool-fixed'):'modes-deep';
  const r=await runTrial({fixture:{columns:7,rows:6,moves:[...root].map(Number)},...c,policy:'inert',
    timeoutMs:750,warmups:20,cadenceMs:5,measureCycles:true});
  appendFileSync(output,JSON.stringify({type:'trial',stage,round,label:c.label,...r})+'\n');
  console.log(round,root||'empty',c.label,r.status,r.evaluatorCycles,r.nodes,r.solveWallMs,
    'active',r.evaluators.filter(e=>e.activated).length);
  assert.notEqual(r.status,'FAILED',JSON.stringify(r.errors));assert.equal(r.cleanup,true);
  if(r.status==='EXACT')assert.equal(r.value,root?1:3,'expected existing fixture WDL or empty-board P0 win');
  else{assert.equal(r.status,'TIMEOUT');assert.equal(r.value,null);}
}
