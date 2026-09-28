import assert from 'node:assert/strict';
import {spawnSync,execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,appendFileSync,existsSync} from 'node:fs';
import {cpus,totalmem,release} from 'node:os';
const dir='evidence/isomax-phase2-nightly-empty-20260928',mode=process.argv[2];
assert.ok(mode==='runtime'||mode==='empty');
const nightly=JSON.parse(readFileSync(dir+'/runtime.json','utf8').replace(/^\uFEFF/,''));
const stable='C:/r/c4-compact-q1/node-v26.7.0-win-x64/node.exe';
const sources={A:['C:/r/isomax-p2-proof-mask-A','be7c2887defcefb37080fa61de7ce1dc38dc2990'],B:['C:/r/isomax-p2-proof-mask-B','7f74e324457c4237590bc6b0f924852f6d728e4c']};
const git=(p,...args)=>execFileSync('git',['-C',p,...args],{encoding:'utf8'}).trim();
const moves=mode==='runtime'?'353335714':'',timeoutMs=mode==='runtime'?90000:600000,order=mode==='runtime'?'ABBAABBA':'AB',rows=[];
const manifestPath=dir+'/'+mode+'-manifest.json';
if(!existsSync(manifestPath))writeFileSync(manifestPath,JSON.stringify({mode,moves,timeoutMs,order,sources,stable,nightly,startedAt:new Date().toISOString(),environment:{os:release(),cpu:cpus()[0].model,logicalProcessors:cpus().length,ramBytes:totalmem()},topology:{workers:4,wide:0,deep:[1,2,3]}},null,2)+'\n');
const rawPath=dir+'/'+mode+'-processes.jsonl',prior=existsSync(rawPath)?readFileSync(rawPath,'utf8').trim().split('\n').filter(Boolean).map(JSON.parse):[];
for(const [index,arm] of [...order].entries()){
 const sourceArm=mode==='runtime'?'A':arm,[path,sha]=sources[sourceArm];
 const node=mode==='runtime'&&arm==='A'?stable:nightly.nodeExe;
 const version=execFileSync(node,['--version'],{encoding:'utf8'}).trim();
 assert.equal(version,node===stable?'v26.7.0':nightly.version);
 assert.equal(git(path,'rev-parse','HEAD'),sha);assert.equal(git(path,'status','--porcelain'),'');
 let raw=prior.find(r=>r.index===index);
 if(!raw){console.log('START '+mode+' '+index+' '+arm+' '+version);
  const r=spawnSync(node,['--experimental-ffi','experiments/isomax-phase2/cpc-proof-mask-source-sample.mjs',path,moves,String(timeoutMs)],{encoding:'utf8',windowsHide:true,timeout:timeoutMs+30000,maxBuffer:4*1024*1024});
  raw={mode,index,arm,sourceArm,node,version,sourceSha:sha,recordedAt:new Date().toISOString(),status:r.status,signal:r.signal,error:r.error?.message??null,stdout:r.stdout,stderr:r.stderr};
  appendFileSync(rawPath,JSON.stringify(raw)+'\n');
 }
 assert.equal(raw.node,node);assert.equal(raw.status,0);assert.equal(raw.error,null);
 const row={...JSON.parse(raw.stdout),index,arm,sourceArm,nodeVersion:version};
 assert.equal(row.sourceSha,sha);assert.equal(row.fixture,moves);assert.equal(row.cleanup,true);assert.equal(row.workersExited,4);assert.deepEqual(row.errors,[]);assert.ok(row.nodeCounts.every(n=>Number.isSafeInteger(n)&&n>0));assert.equal(row.nodeCountsExact,true);
 assert.deepEqual(row.config,{workers:4,sharedCacheCapacity:4194304,localCacheCapacity:1048576,sharedSampleMask:0,rootFrontier:true,timeoutMs});
 if(row.status==='EXACT'){assert.equal(row.rootWdl,mode==='runtime'?-1:1);assert.equal(row.errorCode,0);if(mode==='runtime')assert.equal(row.move,4);for(const r of rows.filter(r=>r.status==='EXACT'))assert.equal(row.move,r.move);}
 else {assert.equal(row.status,'TIMEOUT');assert.equal(row.errorCode,102);assert.equal(row.rootWdl,null);}
 rows.push(row);writeFileSync(dir+'/'+mode+'-samples.jsonl',rows.map(r=>JSON.stringify(r)).join('\n')+'\n');
 console.log(JSON.stringify({mode,index,arm,status:row.status,rootWdl:row.rootWdl,wallMs:row.wallMs,cycles:row.solveCycles,nodes:row.totalNodes}));
}
