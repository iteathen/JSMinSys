import {runTrial} from './host.mjs';
import {appendFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const [output,roundText='1']=process.argv.slice(2),rounds=Number(roundText);
if(!output||existsSync(output))throw Error('new output path required');
assert.ok(Number.isInteger(rounds)&&rounds>=1&&rounds<=3);
const roots=['2053635233350500','1320461024522311','132046102452231'];
const labels=['modes-deep','modes-width-observe','modes-width-delta','modes-width-relative'];
appendFileSync(output,JSON.stringify({type:'metadata',sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  dirty:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),node:process.version,date:new Date().toISOString(),
  roots,labels,rounds,workers:1,timeoutMs:750,warmups:20,observerCapacity:512,observerBatch:64,
  scope:'Strategist root-derived canonical unresolved frontier delta, not worker-private frontier. All evaluator solve-call cycles; strategist separate.'})+'\n');
const oracle=new Map(),deepNodes=new Map();
for(let round=0;round<rounds;round++)for(const root of roots)for(let j=0;j<labels.length;j++){
  const label=labels[(j+round)%labels.length];
  process.env.JSMINSYS_STRATEGIST_POLICY=label;
  const r=await runTrial({fixture:{columns:7,rows:6,moves:[...root].map(Number)},workers:1,policy:'inert',
    timeoutMs:750,warmups:20,measureCycles:true});
  appendFileSync(output,JSON.stringify({type:'trial',round,label,...r})+'\n');
  console.log(round,root,label,r.status,r.evaluatorCycles,r.nodes,'changes',r.evaluators[0]?.changes,
    'observer',JSON.stringify(r.strategist?.widthObserver??null));
  assert.notEqual(r.status,'FAILED',JSON.stringify(r.errors));assert.equal(r.cleanup,true);
  if(r.status==='EXACT'){
    const answer={value:r.value,move:r.evaluators[0].result.move};
    if(!oracle.has(root))oracle.set(root,answer);
    assert.deepEqual(answer,oracle.get(root));
    if(label==='modes-deep'||label==='modes-width-observe'){
      if(!deepNodes.has(root))deepNodes.set(root,r.nodes);
      assert.equal(r.nodes,deepNodes.get(root),'observer must leave evaluator traversal unchanged');
    }
  }
}
