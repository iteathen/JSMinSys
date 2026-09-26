// Experiment driver: uses the existing host without changing its interface or
// lifecycle. Only strategist/flag handler selection is varied via cold env.
import {runTrial} from './host.mjs';
import {appendFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const mode=process.argv[2],output=process.argv[3];
if(!output||existsSync(output))throw Error('new output path required');
const a=[2,0,5,3,6,3,5,2,3,3,3,5,0,5,0,0,1,6,1,4,3,4,2,6,6,0,6,4];
const b=[1,3,2,0,4,6,1,0,2,4,5,2,2,3,1,1,1,5,1,3,2,4,6,0,4,4,6,2,0,4,3,3];
const c=[6,0,2,1,5,2,1,1,1,0,5,2,5,2,4,1,0,1,4,3,2,6,6,6,6,2,4,4,0,6,0,3,4,5,4];
const f=moves=>({columns:7,rows:6,moves});
const cases=[];
if(mode==='screen'){
  for(const [sequence,lengths] of [[a,[16,17,19,20]],[b,[15,16,17,20]],[c,[20,22,24]]])
    for(const n of lengths)cases.push({fixture:f(sequence.slice(0,n)),label:'two-worker',round:0});
}else if(mode==='strategies'){
  const labels=['one-worker','two-worker','inert','sparse','anchor-private','wide-private','harvest','wide-harvest','seed-retire','wide-seed','thin-sharing'];
  // Chosen before looking at policy results; add screened roots in a separate pass.
  for(let round=0;round<3;round++)for(const fixture of [{columns:4,rows:4,moves:[]},f(a.slice(0,18))])
    for(let i=0;i<labels.length;i++)cases.push({fixture,label:labels[(i+round*4)%labels.length],round});
}else if(mode==='confirmation'){
  // Independent B root plus longer A root, selected using baseline screening.
  // Preserve one-worker control: retiring helpers must beat it to show a gain
  // beyond simply reducing duplicated two-worker effort.
  const labels=['one-worker','two-worker','inert','sparse','wide-private','seed-retire','wide-seed'];
  for(let round=0;round<3;round++)for(const fixture of [f(a.slice(0,16)),f(b.slice(0,16))])
    for(let i=0;i<labels.length;i++)cases.push({fixture,label:labels[(i+round*3)%labels.length],round});
}else throw Error('mode');
appendFileSync(output,JSON.stringify({type:'metadata',mode,sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  dirty:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),node:process.version,date:new Date().toISOString(),
  dispatch:process.env.JSMINSYS_FLAG_DISPATCH??'integer',scope:'Strategist-only policies using existing flag handlers and unmodified host/evaluator. Fixed 5ms requested observation interval; no cadence optimization. All evaluator solve-call cycles counted.'})+'\n');
for(const {fixture,label,round} of cases){
  const hostPolicy=label==='one-worker'||label==='two-worker'?'host-only':label==='inert'||label==='sparse'?label:'inert';
  if(['one-worker','two-worker','inert','sparse'].includes(label))delete process.env.JSMINSYS_STRATEGIST_POLICY;
  else process.env.JSMINSYS_STRATEGIST_POLICY=label;
  process.env.JSMINSYS_STRATEGIST_CELLS=String(fixture.columns*fixture.rows);
  const result=await runTrial({fixture,policy:hostPolicy,workers:label==='one-worker'?1:2,measureCycles:true,
    cadenceMs:5,holdMs:20,warmups:20,timeoutMs:mode==='screen'?500:750});
  appendFileSync(output,JSON.stringify({type:'trial',label,round,...result})+'\n');
  console.log(label,fixture.columns,fixture.moves.join('')||'empty',result.status,result.value,result.evaluatorCycles,result.nodes,
    result.strategist?.trace.some(t=>t.harvestEligible),result.strategist?.trace.some(t=>t.helperStopPublished));
  if(result.status==='FAILED')throw Error(JSON.stringify(result.errors));
}
