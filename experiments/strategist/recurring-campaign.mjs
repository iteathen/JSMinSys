import {runTrial} from './host.mjs';
import {appendFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const [output,mode='unbounded',roundText='3']=process.argv.slice(2);
if(!output||existsSync(output))throw Error('new output path required');
assert.ok(['unbounded','bounded'].includes(mode));
const rounds=Number(roundText);assert.ok(Number.isInteger(rounds)&&rounds>=1&&rounds<=3);
const roots=['2053635233350500','1320461024522311','132046102452231'];
const labels=mode==='bounded'?['baseline','frontier-2-narrow','frontier-2-recurring-bounded','frontier-4-recurring-bounded']:
  ['baseline','frontier-2-narrow','frontier-recurring-off','frontier-2-recurring','frontier-4-recurring'];
appendFileSync(output,JSON.stringify({type:'metadata',sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  dirty:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),node:process.version,date:new Date().toISOString(),
  roots,labels,rounds,mode,workers:1,timeoutMs:750,warmups:20,
  scope:'Branch-local recurring PFIF; full solve-call evaluator cycles, all local passes charged. Third root is adjacent to B, not independent.'})+'\n');
const oracle=new Map(),onewayNodes=new Map();
for(let round=0;round<rounds;round++)for(const root of roots)for(let j=0;j<labels.length;j++){
  const label=labels[(j+round*2)%labels.length];
  process.env.JSMINSYS_FLAG_DISPATCH='actions';
  if(label==='baseline')delete process.env.JSMINSYS_STRATEGIST_POLICY;
  else process.env.JSMINSYS_STRATEGIST_POLICY=label;
  const r=await runTrial({fixture:{columns:7,rows:6,moves:[...root].map(Number)},workers:1,
    policy:label==='baseline'?'host-only':'inert',timeoutMs:750,warmups:20,measureCycles:true});
  appendFileSync(output,JSON.stringify({type:'trial',round,label,...r})+'\n');
  const metrics=r.evaluators[0]?.result.metrics;
  console.log(round,root,label,r.status,r.evaluatorCycles,r.nodes,
    'local-reentries',metrics?.recurringLocalReentries??0);
  assert.notEqual(r.status,'FAILED',JSON.stringify(r.errors));assert.equal(r.cleanup,true);
  if(r.status==='EXACT'){
    const answer={value:r.value,move:r.evaluators.find(e=>e.index===r.winner).result.move};
    if(!oracle.has(root))oracle.set(root,answer);
    assert.deepEqual(answer,oracle.get(root));
    if(label==='frontier-2-narrow'||label==='frontier-recurring-off'){
      if(!onewayNodes.has(root))onewayNodes.set(root,r.nodes);
      assert.equal(r.nodes,onewayNodes.get(root),'disabled recurrence must preserve traversal');
    }
  }
}
