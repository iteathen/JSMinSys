import {runTrial} from './host.mjs';
import {appendFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const [output]=process.argv.slice(2);
if(!output||existsSync(output))throw Error('new output path required');
const labels=['baseline','actions-zero','frontier-full','frontier-2','frontier-4','frontier-8','frontier-4-release'];
const roots=['2053635233350500','1320461024522311'];
appendFileSync(output,JSON.stringify({type:'metadata',sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  dirty:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),node:process.version,date:new Date().toISOString(),
  labels,roots,rounds:3,workers:1,timeoutMs:750,
  scope:'PFIF worker specialization, behavior actions and strategist. Whole evaluator solve-call cycles; includes all repeated passes. No TT or ordinary solver changes.'})+'\n');
const oracle=new Map();
for(let round=0;round<3;round++)for(const root of roots)for(let j=0;j<labels.length;j++){
  const label=labels[(j+round*3)%labels.length];
  process.env.JSMINSYS_FLAG_DISPATCH='actions';
  if(label==='baseline')delete process.env.JSMINSYS_STRATEGIST_POLICY;
  else process.env.JSMINSYS_STRATEGIST_POLICY=label==='actions-zero'?'action-inert':label;
  const r=await runTrial({fixture:{columns:7,rows:6,moves:[...root].map(Number)},workers:1,
    policy:label==='baseline'?'host-only':'inert',timeoutMs:750,warmups:20,measureCycles:true});
  appendFileSync(output,JSON.stringify({type:'trial',round,label,...r})+'\n');
  console.log(round,root,label,r.status,r.evaluatorCycles,r.nodes,r.solveWallMs?.toFixed(2)??'not-solved');
  assert.notEqual(r.status,'FAILED',JSON.stringify(r.errors));assert.equal(r.cleanup,true);
  if(r.status==='EXACT'){
    const move=r.evaluators.find(e=>e.index===r.winner).result.move;
    if(!oracle.has(root))oracle.set(root,{value:r.value,move});
    assert.deepEqual({value:r.value,move},oracle.get(root));
  }
}
