import {runTrial} from './host.mjs';
import {appendFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const output=process.argv[2];
if(!output||existsSync(output))throw Error('new output path required');
const roots=['2053635233350500','1320461024522311','132046102452231'];
const labels=['frontier-full','modes-deep','modes-switch-check'];
appendFileSync(output,JSON.stringify({type:'metadata',sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  dirty:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),node:process.version,date:new Date().toISOString(),
  roots,labels,rounds:3,workers:1,timeoutMs:750,warmups:20,
  scope:'Mode ownership/control diagnostic, not expansion-trigger optimization. Entire solve-call evaluator cycles; strategist separate.'})+'\n');
const oracle=new Map(),deepNodes=new Map();
for(let round=0;round<3;round++)for(const root of roots)for(let j=0;j<labels.length;j++){
  const label=labels[(j+round)%labels.length];
  process.env.JSMINSYS_FLAG_DISPATCH='actions';process.env.JSMINSYS_STRATEGIST_POLICY=label;
  const r=await runTrial({fixture:{columns:7,rows:6,moves:[...root].map(Number)},workers:1,policy:'inert',
    timeoutMs:750,warmups:20,measureCycles:true});
  appendFileSync(output,JSON.stringify({type:'trial',round,label,...r})+'\n');
  console.log(round,root,label,r.status,r.evaluatorCycles,r.nodes,'changes',r.evaluators[0]?.changes);
  assert.notEqual(r.status,'FAILED',JSON.stringify(r.errors));assert.equal(r.cleanup,true);
  if(r.status==='EXACT'){
    const answer={value:r.value,move:r.evaluators[0].result.move};
    if(!oracle.has(root))oracle.set(root,answer);
    assert.deepEqual(answer,oracle.get(root));
    if(label!=='modes-switch-check'){
      if(!deepNodes.has(root))deepNodes.set(root,r.nodes);
      assert.equal(r.nodes,deepNodes.get(root),'DEEP must preserve full-frontier traversal');
    }
  }
}
