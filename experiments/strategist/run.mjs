import {appendFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {cpus} from 'node:os';
import {runTrial} from './host.mjs';

const mode=process.argv[2]??'screen',output=process.argv[3]??'strategist-results.jsonl';
if(existsSync(output))throw Error('refusing to overwrite campaign evidence');
const moves=[4,0,0,0,3,3,0,0,6,2,3,0,2,3,6,3,6,3,4,6,2,2,6,1,2,5,6,4];
const workingMoves=[2,0,5,3,6,3,5,2,3,3,3,5,0,5,0,0,1,6];
const metadata={type:'metadata',mode,sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  dirty:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),node:process.version,v8:process.versions.v8,
  cpu:cpus()[0].model,date:new Date().toISOString(),
  scope:'QueryThreadCycleTime around evaluator solve calls; includes root frame setup/return, excludes warmup/ingress and strategist cycles. Includes losing workers and retirement tail. Other V8 threads excluded. No affinity, preliminary screen, not full NEES qualification.'};
appendFileSync(output,JSON.stringify(metadata)+'\n');
let cases;
if(mode==='screen')cases=[{columns:4,rows:4,moves:[]},...[28,24,22,20,18].map(n=>({columns:7,rows:6,moves:moves.slice(0,n)}))]
  .map(fixture=>({fixture,policy:'poll-only',timeoutMs:500,warmups:20}));
else if(mode==='screen2')cases=[
  [2,0,5,3,6,3,5,2,3,3,3,5,0,5,0,0,1,6,1,4,3,4,2,6,6,0,6,4],
  [1,3,2,0,4,6,1,0,2,4,5,2,2,3,1,1,1,5,1,3,2,4,6,0,4,4,6,2,0,4,3,3],
].flatMap(sequence=>[26,22,18,14].map(n=>({fixture:{columns:7,rows:6,moves:sequence.slice(0,n)},policy:'poll-only',timeoutMs:500,warmups:20})));
else if(mode==='campaign'){
  const fixtures=[{columns:4,rows:4,moves:[]},{columns:7,rows:6,moves:workingMoves}];
  const policies=['poll-only','inert','fixed','rotate','sparse','adaptive','combined','fixed-sparse'];
  cases=[];
  for(let round=0;round<4;round++)for(const fixture of fixtures)
    for(let i=0;i<policies.length;i++)cases.push({fixture,policy:policies[(i+(round*3))%policies.length],round,cadenceMs:5,timeoutMs:750,warmups:20});
}else if(mode==='cadence'){
  cases=[];
  for(let round=0;round<3;round++)for(const cadenceMs of [1,5,25])for(const policy of ['inert','rotate','combined'])
    cases.push({fixture:{columns:7,rows:6,moves:workingMoves},policy,cadenceMs,round,timeoutMs:750,warmups:20});
}else if(mode==='confirmation'){
  cases=[];
  const policies=['host-only','poll-only','inert','fixed','sparse','fixed-sparse'];
  for(let round=0;round<4;round++)for(const fixture of [
    {columns:4,rows:4,moves:[]},
    {columns:7,rows:6,moves:workingMoves},
    {columns:7,rows:6,moves:workingMoves.map(c=>6-c)},
  ])for(let i=0;i<policies.length;i++)cases.push({fixture,policy:policies[(i+round)%policies.length],round,cadenceMs:5,timeoutMs:750,warmups:20});
}else throw Error('unknown mode');
for(const c of cases){
  const result=await runTrial({...c,workers:2,measureCycles:true});
  appendFileSync(output,JSON.stringify({type:'trial',round:c.round??0,...result})+'\n');
  console.log(`${result.fixture.columns}x${result.fixture.rows}/${result.fixture.moves.length} ${result.policy}/${result.cadenceMs} ${result.status} value=${result.value} cycles=${result.evaluatorCycles} nodes=${result.nodes} changes=${result.evaluators.reduce((n,w)=>n+w.changes,0)}`);
  if(result.status==='FAILED')throw Error(JSON.stringify(result.errors));
}
