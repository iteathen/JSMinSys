import assert from 'node:assert/strict';
import {spawnSync,execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync,appendFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {cpus,totalmem,freemem,release} from 'node:os';
const dir='evidence/isomax-memory-affinity-20260928',packetPath=process.argv[2],p=JSON.parse(readFileSync(packetPath,'utf8'));
const runtime=JSON.parse(readFileSync(dir+'/runtime.json','utf8')),library=p.library??'C:/r/isomax-p2-proof-mask-A',sha=p.sourceSha??'be7c2887defcefb37080fa61de7ce1dc38dc2990';
const git=(path,...args)=>execFileSync('git',['-C',path,...args],{encoding:'utf8'}).trim();
const helperSha=git('.','rev-parse','HEAD');
assert.match(p.id,/^[a-zA-Z0-9-]+$/);assert.ok(['A','AB','ABBA','ABBAABBA'].includes(p.order));assert.ok(p.timeoutMs<=600000&&p.timeoutMs>0);assert.ok(['','35333571','353335714','151231','4444'].includes(p.fixture));
assert.equal(existsSync(`${dir}/${p.id}-raw.jsonl`),false,'never silently repeat a packet');
assert.equal(execFileSync(runtime.nodeExe,['--version'],{encoding:'utf8'}).trim(),runtime.version);
const targets=JSON.parse(readFileSync(dir+'/targets.json','utf8'));
writeFileSync(`${dir}/${p.id}-manifest.json`,JSON.stringify({packet:p,helperSha,sha,library,runtime,startedAt:new Date().toISOString(),environment:{os:release(),cpu:cpus()[0].model,logical:cpus().length,ram:totalmem(),freeRam:freemem()},cycleCounter:'QueryProcessCycleTime, whole host/worker operation',topology:{wide:0,deep:[1,2,3]},targets},null,2)+'\n');
const rows=[];
for(const [index,arm] of [...p.order].entries()){
 const c=p.arms[arm];assert.equal(git(library,'rev-parse','HEAD'),sha);assert.equal(git(library,'status','--porcelain'),'');
 assert.equal(git('.','diff',helperSha,'--','addons','tools','catalog'),'','affinity/helper source drift');
 assert.ok([4194304,67108864,268435456].includes(c.shared));assert.ok([1048576,16384,32768,65536,524288,2097152,4194304,8388608,16777216,33554432].includes(c.private));assert.ok(!c.pin||c.preload);
 const prefix=resolve(dir,`${p.id}-${index}-affinity`),env={...process.env};delete env.NODE_OPTIONS;delete env.JMS_WORKER_AFFINITY_FILE;delete env.JMS_WORKER_AFFINITY_REPORT;
 if(c.pin){env.JMS_WORKER_AFFINITY_FILE=resolve(dir,'targets.json');env.JMS_WORKER_AFFINITY_REPORT=prefix;}
 const args=['--experimental-ffi'];if(c.preload)args.push('--import',pathToFileURL(resolve('tools/worker-affinity-preload.mjs')).href);
 args.push(dir+'/sample.mjs',library,p.fixture,String(p.timeoutMs),String(c.shared),String(c.private));
 const startedAt=new Date().toISOString();console.log(JSON.stringify({packet:p.id,index,arm,config:c,startedAt}));
 const r=spawnSync(runtime.nodeExe,args,{encoding:'utf8',env,windowsHide:true,timeout:p.timeoutMs+30000,maxBuffer:8*1024*1024});
 const raw={index,arm,startedAt,endedAt:new Date().toISOString(),args,status:r.status,signal:r.signal,error:r.error?.message??null,stdout:r.stdout,stderr:r.stderr};
 appendFileSync(`${dir}/${p.id}-raw.jsonl`,JSON.stringify(raw)+'\n');assert.equal(raw.status,0);assert.equal(raw.error,null);
 const row={...JSON.parse(raw.stdout),index,arm,helperSha,placement:c.pin?'p-core':'off',preload:!!c.preload};
 appendFileSync(`${dir}/${p.id}-samples.jsonl`,JSON.stringify(row)+'\n');
 assert.equal(row.sourceSha,sha);assert.equal(row.fixture,p.fixture);assert.equal(row.config.sharedCacheCapacity,c.shared);assert.equal(row.config.localCacheCapacity,c.private);assert.equal(row.cleanup,true);assert.equal(row.workersExited,4);assert.deepEqual(row.errors,[]);assert.ok(row.nodeCounts.every(n=>n>0));
 if(c.pin)for(let i=0;i<4;i++){const rec=JSON.parse(readFileSync(prefix+'-'+i+'.json','utf8'));assert.equal(rec.index,i);assert.equal(rec.actual.group,targets[i].group);assert.equal(rec.actual.processor,targets[i].processor);assert.equal(rec.actual.mask,String(1n<<BigInt(targets[i].processor)));}
 if(row.status==='EXACT'){assert.equal(row.errorCode,0);if(p.fixture==='4444'){assert.ok([-1,0,1].includes(row.rootWdl));assert.ok(Number.isInteger(row.move)&&row.move>=0&&row.move<7);}else{assert.equal(row.rootWdl,p.fixture==='151231'?1:p.fixture?-1:1);if(p.fixture&&p.fixture!=='151231')assert.equal(row.move,4);if(p.fixture==='151231')assert.ok(Number.isInteger(row.move)&&row.move>=0&&row.move<7);}}
 else{assert.equal(row.status,'TIMEOUT');assert.equal(row.errorCode,102);assert.equal(row.rootWdl,null);}
 rows.push(row);console.log(JSON.stringify({packet:p.id,index,arm,status:row.status,cycles:row.solveCycles,wallMs:row.wallMs,nodes:row.totalNodes}));
 if(p.stopOnCensoredFirstPair&&index===1&&rows.some(r=>r.status!=='EXACT')){console.log('CENSORED FIRST PAIR: stopped per plan');break;}
}
