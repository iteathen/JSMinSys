// Cold evidence controller only. The fixed-source production runners own timing.
import assert from 'node:assert/strict';
import {appendFileSync,createWriteStream,existsSync,readFileSync,writeFileSync} from 'node:fs';
import {execFileSync,spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {setTimeout as pause} from 'node:timers/promises';
const out=fileURLToPath(new URL('.',import.meta.url));
const manifest=JSON.parse(readFileSync(resolve(out,'manifest.json'),'utf8'));
const block=Number(process.argv[2]);assert.ok(block===0||block===1);
assert.equal(process.version,'v26.7.0');
const git=(cwd,...args)=>execFileSync('git',args,{cwd,encoding:'utf8'}).trim();
for(const [slot,arm] of [...'ABBA'].entries()){
  const source=manifest.sources[arm],stem=`block-${block}-${slot}-${arm}`;
  assert.equal(git(source.path,'rev-parse','HEAD'),source.sha);
  assert.equal(git(source.path,'status','--porcelain'),'');
  assert.ok(!existsSync(resolve(out,stem+'.stdout.log')),'refuse to overwrite evidence');
  await pause(3000);
  const startedAt=new Date().toISOString();
  const args=['--experimental-ffi','tools/run-isomax.mjs',JSON.stringify(manifest.input)];
  console.log(JSON.stringify({event:'start',block,slot,arm,startedAt}));
  const stdoutFile=createWriteStream(resolve(out,stem+'.stdout.log'));
  const stderrFile=createWriteStream(resolve(out,stem+'.stderr.log'));
  let stdout='',stderr='',spawnError=null,contained=false;
  const child=spawn(process.execPath,args,{cwd:source.path,windowsHide:true});
  child.stdout.on('data',x=>{stdout+=x;stdoutFile.write(x);});
  child.stderr.on('data',x=>{stderr+=x;stderrFile.write(x);});
  child.on('error',e=>{spawnError=e.message;});
  const heartbeat=setInterval(()=>console.log(JSON.stringify({event:'running',block,slot,arm,at:new Date().toISOString()})),30000);
  const containment=setTimeout(()=>{contained=true;child.kill();},150000);
  const result=await new Promise(resolve=>child.on('close',(code,signal)=>resolve({code,signal})));
  clearInterval(heartbeat);clearTimeout(containment);
  await Promise.all([new Promise(r=>stdoutFile.end(r)),new Promise(r=>stderrFile.end(r))]);
  const processRecord={block,slot,arm,sha:source.sha,startedAt,endedAt:new Date().toISOString(),args,...result,spawnError,contained};
  writeFileSync(resolve(out,stem+'.process.json'),JSON.stringify(processRecord,null,2)+'\n');
  assert.equal(result.code,0,`preserved failure ${stem}: ${stderr}`);
  assert.equal(contained,false);
  const row={...JSON.parse(stdout.trim()),...processRecord};
  appendFileSync(resolve(out,'samples.jsonl'),JSON.stringify(row)+'\n');
  assert.deepEqual(row.config,{...manifest.profile.options,...manifest.input});
  assert.equal(row.requestedWorkers,7);assert.equal(row.workersUsed,7);
  assert.equal(row.workersExited,7);assert.equal(row.cleanup,true);
  assert.equal(row.errorCode,row.status==='TIMEOUT'?102:0);assert.deepEqual(row.errors,[]);
  assert.ok(row.nodeCounts.length===7&&row.nodeCounts.every(n=>n>0),'every worker must do work');
  assert.ok(['EXACT','TIMEOUT'].includes(row.status));
  if(row.status==='EXACT'){
    assert.equal(row.rootWdl,manifest.expected.rootWdl);assert.equal(row.move,manifest.expected.move);
  }
  console.log(JSON.stringify({event:'result',block,slot,arm,status:row.status,rootWdl:row.rootWdl,move:row.move,solveCycles:row.solveCycles,wallMs:row.wallMs,totalNodes:row.totalNodes,nodeCounts:row.nodeCounts}));
}
