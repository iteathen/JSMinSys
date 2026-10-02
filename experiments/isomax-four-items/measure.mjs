import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,appendFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const packet=JSON.parse(readFileSync(process.argv[2],'utf8'));
assert.match(packet.id,/^[a-z0-9-]+$/);
assert.ok(packet.order.length>0&&[...packet.order].every(arm=>packet.arms[arm]));
const dir='evidence/'+packet.id;
const runtime=JSON.parse(readFileSync('evidence/isomax-memory-affinity-20260928/runtime.json'));
const targets=JSON.parse(readFileSync('evidence/isomax-memory-affinity-20260928/targets.json'));
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
assert.equal(git('status','--porcelain'),'','commit the candidate before timing');
assert.equal(existsSync(dir+'/raw.jsonl'),false,'never overwrite measured evidence');
assert.equal(execFileSync(runtime.nodeExe,['--version'],{encoding:'utf8'}).trim(),runtime.version);
mkdirSync(dir,{recursive:true});
const helperSha=git('rev-parse','HEAD'),order=packet.order,rows=[];
writeFileSync(dir+'/manifest.json',JSON.stringify({helperSha,packet,runtime,targets,startedAt:new Date().toISOString()},null,2)+'\n');
for(const [index,arm] of [...order].entries()){
  const {library,sourceSha}=packet.arms[arm];
  assert.equal(git('-C',library,'rev-parse','HEAD'),sourceSha);
  assert.equal(git('-C',library,'diff','HEAD','--','experiments','addons','src','tools'),'');
  const prefix=resolve(dir,`affinity-${index}`),env={...process.env};delete env.NODE_OPTIONS;
  env.JMS_WORKER_AFFINITY_FILE=resolve('evidence/isomax-memory-affinity-20260928/targets.json');
  env.JMS_WORKER_AFFINITY_REPORT=prefix;
  const preload='tools/worker-affinity-preload.mjs';
  const args=['--experimental-ffi','--import',pathToFileURL(resolve(preload)).href,'experiments/isomax-four-items/sample.mjs',library,arm];
  console.log(JSON.stringify({index,arm,startedAt:new Date().toISOString()}));
  const r=spawnSync(runtime.nodeExe,args,{env,encoding:'utf8',windowsHide:true,timeout:330000,maxBuffer:8*1024*1024});
  appendFileSync(dir+'/raw.jsonl',JSON.stringify({index,arm,args,status:r.status,signal:r.signal,error:r.error?.message??null,stdout:r.stdout,stderr:r.stderr})+'\n');
  assert.equal(r.status,0);assert.equal(r.error,undefined);
  const row={index,...JSON.parse(r.stdout)};
  appendFileSync(dir+'/samples.jsonl',JSON.stringify(row)+'\n');
  assert.equal(row.status,'EXACT');assert.equal(row.rootWdl,1);assert.equal(row.move,3);
  assert.equal(row.sourceSha,sourceSha);assert.equal(row.searchRootSequence,'44444');assert.equal(row.searchCalls,1);
  assert.equal(row.cleanup,true);assert.equal(row.workersExited,4);assert.deepEqual(row.errors,[]);
  for(let i=0;i<4;i++){
    const report=JSON.parse(readFileSync(prefix+'-'+i+'.json'));
    assert.equal(report.actual.group,targets[i].group);assert.equal(report.actual.processor,targets[i].processor);
    assert.equal(report.actual.mask,String(1n<<BigInt(targets[i].processor)));
  }
  assert.equal(row.nodeCounts,null);assert.equal(row.sharedCacheHits,null);
  rows.push(row);console.log(JSON.stringify({index,arm,wallMs:row.wallMs,solveCycles:row.solveCycles,peakRssBytes:row.peakRssBytes}));
}
const mean=(arm,field)=>{const r=rows.filter(r=>r.arm===arm);return r.reduce((n,s)=>n+Number(s[field]),0)/r.length;};
const comparison=Object.keys(packet.arms).map(arm=>({arm,sourceSha:packet.arms[arm].sourceSha,meanWallMs:mean(arm,'wallMs'),
  meanCycles:mean(arm,'solveCycles'),percentLowerWall:100*(1-mean(arm,'wallMs')/mean('A','wallMs')),
  percentLowerCycles:100*(1-mean(arm,'solveCycles')/mean('A','solveCycles'))}));
writeFileSync(dir+'/SUMMARY.json',JSON.stringify({helperSha,order,comparison,
  rows:rows.map(({index,arm,wallMs,solveCycles,cpuMs,peakRssBytes})=>({index,arm,wallMs,solveCycles,cpuMs,peakRssBytes})),
  sampleCounts:Object.fromEntries(Object.keys(packet.arms).map(arm=>[arm,rows.filter(r=>r.arm===arm).length])),
  limits:'Local comparison on this host, not a universal or statistically robust speed claim. Node counts intentionally unavailable. See the packet protocol for warm-up exclusion and block analysis.'},null,2)+'\n');
