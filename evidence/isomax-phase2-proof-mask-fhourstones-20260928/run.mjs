import assert from 'node:assert/strict';
import {spawnSync,execFileSync} from 'node:child_process';
import {readFileSync,appendFileSync,mkdirSync,existsSync} from 'node:fs';
const dir='evidence/isomax-phase2-proof-mask-fhourstones-20260928';
const cases=[['45461667',1],['35333571',-1],['13333111',0],['',1]];
const sources={A:['C:/r/isomax-p2-proof-mask-A','be7c2887defcefb37080fa61de7ce1dc38dc2990'],B:['C:/r/isomax-p2-proof-mask-B','7f74e324457c4237590bc6b0f924852f6d728e4c']};
const sample='experiments/isomax-phase2/cpc-proof-mask-source-sample.mjs';
const git=(path,...args)=>execFileSync('git',['-C',path,...args],{encoding:'utf8'}).trim();
const validCode=r=>r.status==='TIMEOUT'?r.errorCode===102:r.status==='EXACT'&&r.errorCode===0;
assert.equal(validCode({status:'TIMEOUT',errorCode:102}),true);
assert.equal(validCode({status:'EXACT',errorCode:102}),false);
assert.equal(validCode({status:'TIMEOUT',errorCode:101}),false);
for(const [moves,expected] of cases){
 const out=dir+'/'+(moves||'empty');mkdirSync(out,{recursive:true});
 const rawPath=out+'/processes.jsonl';
 const prior=existsSync(rawPath)?readFileSync(rawPath,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse):[];
 const results=[];
 for(const arm of ['A','B']){
  const [path,sha]=sources[arm];assert.equal(git(path,'rev-parse','HEAD'),sha);assert.equal(git(path,'status','--porcelain'),'');
  let raw=prior.find(r=>r.arm===arm);
  if(!raw){
   console.log('START '+(moves||'empty')+' '+arm);
   const r=spawnSync(process.execPath,['--experimental-ffi',sample,path,moves,'120000'],{encoding:'utf8',windowsHide:true,timeout:150000,maxBuffer:4*1024*1024});
   raw={recordedAt:new Date().toISOString(),arm,sourceSha:sha,status:r.status,signal:r.signal,error:r.error?.message??null,stdout:r.stdout,stderr:r.stderr};
   appendFileSync(rawPath,JSON.stringify(raw)+'\n');
  }
  assert.equal(raw.status,0);assert.equal(raw.error,null);
  const row={...JSON.parse(raw.stdout.trim()),arm};
  assert.equal(row.sourceSha,sha);assert.equal(row.fixture,moves);
  assert.ok(validCode(row));assert.equal(row.cleanup,true);assert.equal(row.workersExited,4);assert.deepEqual(row.errors,[]);
  assert.ok(row.nodeCounts.every(n=>Number.isSafeInteger(n)&&n>0));assert.equal(row.nodeCountsExact,true);
  assert.deepEqual(row.config,{workers:4,sharedCacheCapacity:4194304,localCacheCapacity:1048576,sharedSampleMask:0,rootFrontier:true,timeoutMs:120000});
  if(row.status==='EXACT')assert.equal(row.rootWdl,expected);
  results.push(row);
  console.log(JSON.stringify({moves,arm,status:row.status,rootWdl:row.rootWdl,wallMs:row.wallMs,nodes:row.totalNodes,cycles:row.solveCycles,reused:prior.includes(raw)}));
 }
 if(results.every(r=>r.status==='EXACT'))assert.equal(results[0].move,results[1].move);
}
