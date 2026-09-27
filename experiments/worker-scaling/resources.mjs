// Cold sequential campaign driver. No solver, ordering, or worker changes.
import {mkdirSync,writeFileSync,appendFileSync,readFileSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const [planFile,outArg]=process.argv.slice(2),plan=JSON.parse(readFileSync(planFile)),out=resolve(outArg),
  git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim(),sha=git('rev-parse','HEAD');
assert.equal(git('status','--porcelain'),'');
assert.ok(plan.rounds>=1&&plan.rounds<=5);
for(const a of plan.arms){
  assert.ok(Number.isInteger(a.workers)&&a.workers>=4&&a.workers<=12);
  for(const n of [a.sharedCacheCapacity,a.localCacheCapacity])assert.ok(n>=65536&&n<=8388608&&(n&(n-1))===0);
  assert.ok(a.sharedCacheCapacity*64+12+a.workers*a.localCacheCapacity*61<=8*1024**3);
}
assert.ok(plan.timeoutMs>=30000&&plan.timeoutMs<=300000);
mkdirSync(out);
const files=['addons/rba-connect4-alphabeta.mjs','addons/rba-connect4-lazy-smp-host.mjs',
  'addons/rba-connect4-lazy-smp-worker.mjs','addons/rba-connect4-shared-exact-cache.mjs',
  'experiments/cpc-factorial/isomax-node-counts.mjs','experiments/worker-scaling/loader.mjs',
  'experiments/worker-scaling/sample.mjs','experiments/worker-scaling/resources.mjs',
  'experiments/worker-scaling/locked-profile.json'];
writeFileSync(resolve(out,'manifest.json'),JSON.stringify({sha,node:process.version,plan,started:new Date().toISOString(),
  hashes:Object.fromEntries(files.map(f=>[f,createHash('sha256').update(readFileSync(f)).digest('hex')]))},null,2)+'\n');
let n=0;
for(let round=0;round<plan.rounds;round++){
  // Rotate and reverse whole configurations so no arm always runs first/last.
  const shift=(round*Math.ceil(plan.arms.length/3))%plan.arms.length,
    arms=[...plan.arms.slice(shift),...plan.arms.slice(0,shift)];
  if(round%2)arms.reverse();
  for(const arm of arms){
    assert.equal(git('rev-parse','HEAD'),sha);
    const config={...arm,moves:plan.moves,timeoutMs:plan.timeoutMs,sharedSampleMask:0},env={...process.env};
    delete env.SCALE_NO_SHARE;delete env.SCALE_ORDER;
    const p=spawnSync(process.execPath,['--experimental-ffi','--import',
      pathToFileURL(resolve('experiments/worker-scaling/loader.mjs')).href,
      'experiments/worker-scaling/sample.mjs',JSON.stringify(config)],
      {env,encoding:'utf8',timeout:plan.timeoutMs+30000,maxBuffer:4*1024*1024});
    appendFileSync(resolve(out,'processes.jsonl'),JSON.stringify({round,config,exit:p.status,error:p.error?.message,stdout:p.stdout,stderr:p.stderr})+'\n');
    assert.equal(p.status,0,p.stderr);
    const r={...JSON.parse(p.stdout.trim()),round,expected:plan.expected};
    appendFileSync(resolve(out,'samples.jsonl'),JSON.stringify(r)+'\n');
    assert.equal(r.cleanup,true);assert.equal(r.workersExited,arm.workers);assert.equal(r.errors.length,0);
    if(r.status==='EXACT')assert.equal(r.rootWdl,plan.expected);
    else {assert.equal(r.status,'TIMEOUT');assert.equal(plan.allowTimeout,true);}
    n++;console.log(JSON.stringify({n,round,id:arm.id,status:r.status,ms:r.wallMs,nodes:r.totalNodes,cycles:r.solveCycles,peakRss:r.observedPeakRss}));
  }
}
writeFileSync(resolve(out,'complete.json'),JSON.stringify({trials:n,finished:new Date().toISOString()})+'\n');
