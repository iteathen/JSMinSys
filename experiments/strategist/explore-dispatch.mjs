import {execFileSync} from 'node:child_process';
import {appendFileSync,existsSync} from 'node:fs';
const output=process.argv[2];
if(!output||existsSync(output))throw Error('new output path required');
appendFileSync(output,JSON.stringify({type:'metadata',sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  dirty:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),node:process.version,date:new Date().toISOString(),
  scope:'Four interleaved fresh-process blocks. Existing search, no shared TT to isolate dispatch from semantic work changes. Actual asynchronous flag changes use sharing settings only. Whole solve-call evaluator thread cycles, not isolated instructions.'})+'\n');
const variants=['integer','early','xor','masked'];
for(let block=0;block<4;block++)for(let i=0;i<variants.length;i++){
  const variant=variants[(i+block)%variants.length];
  const result=JSON.parse(execFileSync(process.execPath,['--experimental-ffi','experiments/strategist/dispatch-probe.mjs'],{
    encoding:'utf8',env:{...process.env,JSMINSYS_FLAG_DISPATCH:variant},timeout:30000,stdio:['ignore','pipe','pipe']}));
  appendFileSync(output,JSON.stringify({...result,block})+'\n');
  console.log(block,variant,result.rows.map(r=>`${r.fixture.columns}/${r.scenario}=${r.cyclesPerNode.toFixed(1)}(${r.changes})`).join(' '));
}
