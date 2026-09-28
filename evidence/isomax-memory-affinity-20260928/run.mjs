import assert from 'node:assert/strict';
import {spawnSync,execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,appendFileSync,existsSync} from 'node:fs';
import {cpus,totalmem,freemem,release} from 'node:os';
const dir='evidence/isomax-memory-affinity-20260928', mode=process.argv[2];
assert.ok(['M16','shared'].includes(mode));
const runtime=JSON.parse(readFileSync(dir+'/runtime.json','utf8'));
const library='C:/r/isomax-p2-proof-mask-A',sha='be7c2887defcefb37080fa61de7ce1dc38dc2990';
const git=(...args)=>execFileSync('git',['-C',library,...args],{encoding:'utf8'}).trim();
assert.equal(git('rev-parse','HEAD'),sha);assert.equal(git('status','--porcelain'),'');
assert.equal(execFileSync(runtime.nodeExe,['--version'],{encoding:'utf8'}).trim(),runtime.version);
const fixture=mode==='M16'?'':'35333571',timeoutMs=mode==='M16'?600000:300000,order=mode==='M16'?'B':'ABBAABBA';
const rawPath=dir+'/'+mode+'-raw.jsonl';
assert.equal(existsSync(rawPath),false,'Do not silently rerun/resume an existing experiment');
writeFileSync(dir+'/'+mode+'-manifest.json',JSON.stringify({mode,fixture,timeoutMs,order,sha,library,runtime,startedAt:new Date().toISOString(),environment:{os:release(),cpu:cpus()[0].model,logical:cpus().length,ram:totalmem(),freeRam:freemem()},cycleCounter:'Windows QueryProcessCycleTime user+kernel all threads',shared:{A:4194304,B:67108864},private:1048576,workers:4,wide:0,deep:[1,2,3],affinity:'off'},null,2)+'\n');
const rows=[];
const childEnv={...process.env};delete childEnv.NODE_OPTIONS;delete childEnv.JMS_WORKER_AFFINITY_FILE;delete childEnv.JMS_WORKER_AFFINITY_REPORT;
for(const [index,arm] of [...order].entries()){
 assert.equal(git('rev-parse','HEAD'),sha);assert.equal(git('status','--porcelain'),'');
 const shared=arm==='A'?4194304:67108864,startedAt=new Date().toISOString();
 console.log(JSON.stringify({mode,index,arm,shared,startedAt}));
 const r=spawnSync(runtime.nodeExe,['--experimental-ffi',dir+'/sample.mjs',library,fixture,String(timeoutMs),String(shared),'1048576'],{encoding:'utf8',env:childEnv,windowsHide:true,timeout:timeoutMs+30000,maxBuffer:8*1024*1024});
 const raw={index,arm,startedAt,endedAt:new Date().toISOString(),status:r.status,signal:r.signal,error:r.error?.message??null,stdout:r.stdout,stderr:r.stderr};
 appendFileSync(rawPath,JSON.stringify(raw)+'\n');
 assert.equal(raw.status,0);assert.equal(raw.error,null);
 const row={...JSON.parse(raw.stdout),index,arm};
 appendFileSync(dir+'/'+mode+'-samples.jsonl',JSON.stringify(row)+'\n');
 assert.equal(row.sourceSha,sha);assert.equal(row.config.sharedCacheCapacity,shared);assert.equal(row.config.localCacheCapacity,1048576);assert.equal(row.cleanup,true);assert.equal(row.workersExited,4);assert.deepEqual(row.errors,[]);assert.ok(row.nodeCounts.every(n=>n>0));
 if(row.status==='EXACT'){assert.equal(row.errorCode,0);assert.equal(row.rootWdl,fixture?-1:1);if(fixture)assert.equal(row.move,4);}
 else {assert.equal(row.status,'TIMEOUT');assert.equal(row.errorCode,102);assert.equal(row.rootWdl,null);}
 rows.push(row);
 console.log(JSON.stringify({index,arm,status:row.status,cycles:row.solveCycles,wallMs:row.wallMs,nodes:row.totalNodes}));
 if(mode==='shared'&&index===1&&rows.some(s=>s.status!=='EXACT')){console.log('CENSORED FIRST PAIR: exact campaign stopped by predeclared rule');break;}
}
