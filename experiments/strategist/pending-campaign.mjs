import {runTrial} from './host.mjs';
import {appendFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {cpus} from 'node:os';
import assert from 'node:assert/strict';
const [output,roundText='3']=process.argv.slice(2),rounds=Number(roundText);
if(!output||existsSync(output))throw Error('new output path required');
assert.ok(Number.isInteger(rounds)&&rounds>=1&&rounds<=3);
const roots=['2053635233350500','1320461024522311','132046102452231'];
const labels=['modes-deep','modes-pending-off','modes-pending-read'];
appendFileSync(output,JSON.stringify({type:'metadata',sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  dirty:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),node:process.version,v8:process.versions.v8,
  cpu:cpus()[0].model,date:new Date().toISOString(),roots,labels,rounds,workers:1,timeoutMs:750,warmups:20,cadenceMs:5,
  scope:'Fixed DEEP; per-worker pending query width, not unique positions. Whole evaluator solve-call cycles; strategist separate. B15 is B predecessor.'})+'\n');
const oracle=new Map();
for(let round=0;round<rounds;round++)for(const root of roots)for(let j=0;j<labels.length;j++){
  const label=labels[(j+round)%labels.length];
  process.env.JSMINSYS_STRATEGIST_POLICY=label;
  const r=await runTrial({fixture:{columns:7,rows:6,moves:[...root].map(Number)},workers:1,policy:'inert',
    timeoutMs:750,warmups:20,cadenceMs:5,measureCycles:true});
  appendFileSync(output,JSON.stringify({type:'trial',round,label,...r})+'\n');
  console.log(round,root,label,r.status,r.evaluatorCycles,r.nodes,'pending',JSON.stringify(r.strategist?.pending??null));
  assert.equal(r.status,'EXACT',JSON.stringify(r.errors));assert.equal(r.cleanup,true);
  const answer={value:r.value,move:r.evaluators[0].result.move,nodes:r.nodes};
  if(!oracle.has(root))oracle.set(root,answer);
  assert.deepEqual(answer,oracle.get(root),'observation must leave value, witness and traversal unchanged');
  if(label==='modes-pending-off')assert.equal(r.evaluators[0].result.metrics.observePublications,0);
  if(label==='modes-pending-read')assert.ok(r.strategist.pending[0].samples>=1);
}
