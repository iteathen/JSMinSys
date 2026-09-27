// Causal retest: change only the target-release action for each matched stride.
import {runTrial} from './host.mjs';
import {appendFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const [output]=process.argv.slice(2);
if(!output||existsSync(output))throw Error('new output path required');
const labels=['baseline','frontier-full','frontier-4','frontier-2-narrow','frontier-4-narrow','frontier-8-narrow'];
const roots=['2053635233350500','1320461024522311'];
appendFileSync(output,JSON.stringify({type:'metadata',sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  dirty:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),node:process.version,date:new Date().toISOString(),
  labels,roots,rounds:3,workers:1,timeoutMs:750,warmups:20,target:1})+'\n');
const oracle=new Map();
for(let round=0;round<3;round++)for(const root of roots)for(let j=0;j<labels.length;j++){
  const label=labels[(j+round*2)%labels.length];
  process.env.JSMINSYS_FLAG_DISPATCH='actions';
  if(label==='baseline')delete process.env.JSMINSYS_STRATEGIST_POLICY;
  else process.env.JSMINSYS_STRATEGIST_POLICY=label;
  const r=await runTrial({fixture:{columns:7,rows:6,moves:[...root].map(Number)},workers:1,
    policy:label==='baseline'?'host-only':'inert',timeoutMs:750,warmups:20,measureCycles:true});
  appendFileSync(output,JSON.stringify({type:'trial',round,label,...r})+'\n');
  console.log(round,root,label,r.status,r.evaluatorCycles,r.nodes);
  assert.notEqual(r.status,'FAILED',JSON.stringify(r.errors));assert.equal(r.cleanup,true);
  if(r.status==='EXACT'){
    const answer={value:r.value,move:r.evaluators.find(e=>e.index===r.winner).result.move};
    if(!oracle.has(root))oracle.set(root,answer);
    assert.deepEqual(answer,oracle.get(root));
  }
}
