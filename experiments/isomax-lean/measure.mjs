import assert from 'node:assert/strict';
import {execFileSync,spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync,appendFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const dir='evidence/isomax-hot-loop-cleanup-20261002';
const runtime=JSON.parse(readFileSync('evidence/isomax-memory-affinity-20260928/runtime.json'));
const targets=JSON.parse(readFileSync('evidence/isomax-memory-affinity-20260928/targets.json'));
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
assert.equal(git('status','--porcelain'),'','commit the candidate before timing');
assert.equal(existsSync(dir+'/raw.jsonl'),false,'never overwrite measured evidence');
assert.equal(execFileSync(runtime.nodeExe,['--version'],{encoding:'utf8'}).trim(),runtime.version);
mkdirSync(dir,{recursive:true});
const sourceSha=git('rev-parse','HEAD'),order='ABBA',rows=[];
writeFileSync(dir+'/manifest.json',JSON.stringify({sourceSha,order,runtime,targets,startedAt:new Date().toISOString()},null,2)+'\n');
for(const [index,arm] of [...order].entries()){
  const prefix=resolve(dir,`affinity-${index}`),env={...process.env};delete env.NODE_OPTIONS;
  env.JMS_WORKER_AFFINITY_FILE=resolve('evidence/isomax-memory-affinity-20260928/targets.json');
  env.JMS_WORKER_AFFINITY_REPORT=prefix;
  const preload=arm==='A'?'evidence/isomax-four-deep-20261002/worker-all-deep-preload.mjs':'tools/worker-affinity-preload.mjs';
  const args=['--experimental-ffi','--import',pathToFileURL(resolve(preload)).href,'experiments/isomax-lean/sample.mjs',arm];
  console.log(JSON.stringify({index,arm,startedAt:new Date().toISOString()}));
  const r=spawnSync(runtime.nodeExe,args,{env,encoding:'utf8',windowsHide:true,timeout:330000,maxBuffer:8*1024*1024});
  appendFileSync(dir+'/raw.jsonl',JSON.stringify({index,arm,args,status:r.status,signal:r.signal,error:r.error?.message??null,stdout:r.stdout,stderr:r.stderr})+'\n');
  assert.equal(r.status,0);assert.equal(r.error,undefined);
  const row={index,...JSON.parse(r.stdout)};
  appendFileSync(dir+'/samples.jsonl',JSON.stringify(row)+'\n');
  assert.equal(row.status,'EXACT');assert.equal(row.rootWdl,1);assert.equal(row.move,3);
  assert.equal(row.cleanup,true);assert.equal(row.workersExited,4);assert.deepEqual(row.errors,[]);
  for(let i=0;i<4;i++){
    const report=JSON.parse(readFileSync(prefix+'-'+i+'.json'));
    assert.equal(report.actual.group,targets[i].group);assert.equal(report.actual.processor,targets[i].processor);
    assert.equal(report.actual.mask,String(1n<<BigInt(targets[i].processor)));
    if(arm==='A'){
      const role=JSON.parse(readFileSync(prefix+'-'+i+'-role.json'));
      assert.equal(role.role,'DEEP');assert.equal(role.beforeSolverInitialization,true);
    }
  }
  if(arm==='B'){assert.equal(row.nodeCounts,null);assert.equal(row.sharedCacheHits,null);}
  rows.push(row);console.log(JSON.stringify({index,arm,wallMs:row.wallMs,solveCycles:row.solveCycles,peakRssBytes:row.peakRssBytes}));
}
const mean=arm=>rows.filter(r=>r.arm===arm).reduce((n,r)=>n+r.wallMs,0)/2;
writeFileSync(dir+'/SUMMARY.json',JSON.stringify({sourceSha,order,baselineMeanMs:mean('A'),leanMeanMs:mean('B'),
  percentLowerWallTime:100*(1-mean('B')/mean('A')),rows:rows.map(({index,arm,wallMs,solveCycles,cpuMs,peakRssBytes})=>({index,arm,wallMs,solveCycles,cpuMs,peakRssBytes})),
  limits:'Two samples per arm on this host; not a universal performance claim. Node counts intentionally unavailable in lean arm.'},null,2)+'\n');
