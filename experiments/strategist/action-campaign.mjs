// Bounded validation driver; existing host/evaluator/search stay unchanged.
import {runTrial} from './host.mjs';
import {appendFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
const [mode,output]=process.argv.slice(2);
if(!output||existsSync(output))throw Error('new output path required');
const roots=['2053635233350500','1320461024522311'];
const all=['one','two','inert-early','action-inert','action-sample8','sample8-one',
  'action-private','action-private-helper','action-share-on-reuse','action-proof',
  'action-proof-helper','action-proof-on-reuse','action-proof-private','action-reverse-helper','action-reverse-proof'];
let labels,rounds;
if(mode==='screen'){labels=all;rounds=2;}
else if(mode==='confirm'){
  labels=['one','two','action-inert','action-sample8','sample8-one',...process.argv.slice(4)];
  assert.ok(labels.length>5&&labels.length<=9);for(const name of labels)assert.ok(all.includes(name));
  rounds=4;
}else throw Error('mode');
appendFileSync(output,JSON.stringify({type:'metadata',mode,sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  dirty:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),node:process.version,date:new Date().toISOString(),
  labels,rounds,roots,timeoutMs:750,scope:'Flag actions and strategist only. Sum all evaluator solve-call cycles. Fixed 5ms requested interval. No solver/TT/host/evaluator changes.'})+'\n');
const oracle=new Map();
for(let round=0;round<rounds;round++)for(const root of roots)for(let j=0;j<labels.length;j++){
  const label=labels[(j+round*4)%labels.length];
  const original=label==='one'||label==='two',sampleOne=label==='sample8-one';
  const policy=sampleOne?'action-sample8':label;
  process.env.JSMINSYS_FLAG_DISPATCH=original||label==='inert-early'?'early':'actions';
  if(original||label==='inert-early')delete process.env.JSMINSYS_STRATEGIST_POLICY;
  else process.env.JSMINSYS_STRATEGIST_POLICY=policy;
  const r=await runTrial({fixture:{columns:7,rows:6,moves:[...root].map(Number)},workers:label==='one'||sampleOne?1:2,
    policy:original?'host-only':'inert',cadenceMs:5,holdMs:20,timeoutMs:750,warmups:20,measureCycles:true});
  appendFileSync(output,JSON.stringify({type:'trial',label,round,...r})+'\n');
  console.log(round,root,label,r.status,r.evaluatorCycles,r.nodes,r.solveWallMs.toFixed(2));
  assert.notEqual(r.status,'FAILED',JSON.stringify(r.errors));assert.equal(r.cleanup,true);
  if(r.status==='EXACT'){
    assert.equal(r.value,1);
    const winner=r.evaluators.find(e=>e.index===r.winner);
    if(!oracle.has(root))oracle.set(root,winner.result.move);
    for(const e of r.evaluators)if(e.result.status==='EXACT')assert.equal(e.result.move,oracle.get(root),'root witness drift');
  }
}
