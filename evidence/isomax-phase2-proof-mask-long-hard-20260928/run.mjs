import assert from 'node:assert/strict';
import {spawnSync,execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,appendFileSync,existsSync} from 'node:fs';
import {cpus,totalmem,release,availableParallelism} from 'node:os';
const dir='evidence/isomax-phase2-proof-mask-long-hard-20260928',moves='35333571',timeoutMs=300000;
const sources={A:['C:/r/isomax-p2-proof-mask-A','be7c2887defcefb37080fa61de7ce1dc38dc2990'],B:['C:/r/isomax-p2-proof-mask-B','7f74e324457c4237590bc6b0f924852f6d728e4c']};
const git=(path,...args)=>execFileSync('git',['-C',path,...args],{encoding:'utf8'}).trim();
assert.equal(process.version,'v26.7.0');assert.ok(availableParallelism()>=4);
if(!existsSync(dir+'/manifest.json'))writeFileSync(dir+'/manifest.json',JSON.stringify({startedAt:new Date().toISOString(),sources,moves,timeoutMs,order:'ABBAABBA',environment:{node:process.version,v8:process.versions.v8,os:release(),cpu:cpus()[0].model,logicalProcessors:cpus().length,ramBytes:totalmem(),counter:'QueryProcessCycleTime'},config:{workers:4,wideWorker:0,deepWorkers:[1,2,3],sharedCacheCapacity:4194304,localCacheCapacity:1048576,sharedSampleMask:0,rootFrontier:true}},null,2)+'\n');
const rawPath=dir+'/processes.jsonl',prior=existsSync(rawPath)?readFileSync(rawPath,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse):[],rows=[];
for(const [index,arm] of [...'ABBAABBA'].entries()){
 const [path,sha]=sources[arm];assert.equal(git(path,'rev-parse','HEAD'),sha);assert.equal(git(path,'status','--porcelain'),'');
 let raw=prior.find(r=>r.index===index);
 if(!raw){
  console.log('START '+index+' '+arm);
  const r=spawnSync(process.execPath,['--experimental-ffi','experiments/isomax-phase2/cpc-proof-mask-source-sample.mjs',path,moves,String(timeoutMs)],{encoding:'utf8',windowsHide:true,timeout:timeoutMs+30000,maxBuffer:4*1024*1024});
  raw={index,arm,recordedAt:new Date().toISOString(),sourceSha:sha,status:r.status,signal:r.signal,error:r.error?.message??null,stdout:r.stdout,stderr:r.stderr};
  appendFileSync(rawPath,JSON.stringify(raw)+'\n');
 }
 assert.equal(raw.arm,arm);assert.equal(raw.status,0);assert.equal(raw.error,null);
 const row={...JSON.parse(raw.stdout),index,arm};
 assert.equal(row.sourceSha,sha);assert.equal(row.fixture,moves);assert.equal(row.cleanup,true);assert.equal(row.workersExited,4);assert.deepEqual(row.errors,[]);
 assert.ok(row.nodeCounts.every(n=>Number.isSafeInteger(n)&&n>0));assert.equal(row.nodeCountsExact,true);
 assert.deepEqual(row.config,{workers:4,sharedCacheCapacity:4194304,localCacheCapacity:1048576,sharedSampleMask:0,rootFrontier:true,timeoutMs});
 if(row.status==='EXACT'){assert.equal(row.rootWdl,-1);assert.equal(row.errorCode,0);for(const r of rows.filter(r=>r.status==='EXACT'))assert.equal(row.move,r.move);}
 else {assert.equal(row.status,'TIMEOUT');assert.equal(row.errorCode,102);assert.equal(row.rootWdl,null);}
 rows.push(row);writeFileSync(dir+'/samples.jsonl',rows.map(r=>JSON.stringify(r)).join('\n')+'\n');
 console.log(JSON.stringify({index,arm,status:row.status,rootWdl:row.rootWdl,move:row.move,wallMs:row.wallMs,cycles:row.solveCycles,nodes:row.totalNodes}));
 if(index===1&&rows.some(r=>r.status!=='EXACT')){console.log('STOP: initial pair censored; no completed-solve ratio');break;}
}
writeFileSync(dir+'/completion.json',JSON.stringify({finishedAt:new Date().toISOString(),samples:rows.length,allExact:rows.every(r=>r.status==='EXACT'),completePlannedSeries:rows.length===8},null,2)+'\n');
