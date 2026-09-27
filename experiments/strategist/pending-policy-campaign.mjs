import {runTrial} from './host.mjs';
import {appendFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {cpus} from 'node:os';
import assert from 'node:assert/strict';
const [output,roundText='3',profile='delayed']=process.argv.slice(2),rounds=Number(roundText);
if(!output||existsSync(output))throw Error('new output path required');
assert.ok(Number.isInteger(rounds)&&rounds>=1&&rounds<=3);
assert.ok(profile==='delayed'||profile==='one-band');
const roots=['2053635233350500','1320461024522311','132046102452231'];
const expected=[{value:1,move:3,nodes:99114},{value:1,move:3,nodes:238251},{value:1,move:1,nodes:238252}];
const labels=profile==='one-band'?['modes-deep','modes-pending-band-read','modes-pending-pfif','modes-pending-band']:
  ['modes-deep','modes-pending-read','modes-pending-pfif'];
appendFileSync(output,JSON.stringify({type:'metadata',sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  dirty:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),node:process.version,v8:process.versions.v8,
  cpu:cpus()[0].model,date:new Date().toISOString(),profile,roots,labels,rounds,workers:1,timeoutMs:750,warmups:20,cadenceMs:5,
  scope:'Two consecutive positive pending-width deltas request stride-2 SHALLOW; strategist observes completed band then releases DEEP. Repeating, no timer-based mode decisions. Whole evaluator solve cycles; strategist separate. B15 is B predecessor.'})+'\n');
for(let round=0;round<rounds;round++)for(let k=0;k<roots.length;k++)for(let j=0;j<labels.length;j++){
  const root=roots[k],label=labels[(j+round)%labels.length];
  process.env.JSMINSYS_STRATEGIST_POLICY=label;
  const r=await runTrial({fixture:{columns:7,rows:6,moves:[...root].map(Number)},workers:1,policy:'inert',
    timeoutMs:750,warmups:20,cadenceMs:5,measureCycles:true});
  appendFileSync(output,JSON.stringify({type:'trial',round,label,...r})+'\n');
  console.log(round,root,label,r.status,r.evaluatorCycles,r.nodes,'policy',JSON.stringify(r.strategist?.pendingPolicies??null));
  assert.notEqual(r.status,'FAILED',JSON.stringify(r.errors));assert.equal(r.cleanup,true);
  if(r.status==='EXACT'){
    assert.equal(r.value,expected[k].value);assert.equal(r.evaluators[0].result.move,expected[k].move);
    if(label!=='modes-pending-pfif'&&label!=='modes-pending-band')assert.equal(r.nodes,expected[k].nodes,'control traversal changed');
    if(label==='modes-pending-band'){
      const m=r.evaluators[0].result.metrics;
      assert.equal(m.bandStarted,m.bandCompleted,'exact completion left a band in flight');
      assert.equal(m.modeRegions,m.bandStarted);assert.ok(m.modePasses<=2*m.bandStarted);
    }
  }else{assert.equal(r.status,'TIMEOUT');assert.equal(r.value,null);}
}
