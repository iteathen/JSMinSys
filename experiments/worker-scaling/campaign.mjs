import {mkdirSync,writeFileSync,appendFileSync,readFileSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const out=resolve(process.argv[2]),git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
assert.equal(git('status','--porcelain'),'');const sha=git('rev-parse','HEAD');mkdirSync(out);
const density=process.argv.includes('--density');
const arms=density?[7,0,1,3].flatMap(sharedSampleMask=>[1,4].map(workers=>({id:`mask${sharedSampleMask}-w${workers}`,workers,sharedSampleMask}))):[...[1,2,3,4].map(workers=>({id:'native'+workers,workers})),
  {id:'unshared1',workers:1,noShare:true},{id:'unshared4',workers:4,noShare:true},
  {id:'same-order4',workers:4,order:0},...[1,2,3].map(order=>({id:'solo-offset'+order,workers:1,order}))];
const roots=[['45461667',1],['3164746344461611',-1],['2431572135633422',-1]];
const files=['addons/rba-connect4-alphabeta.mjs','addons/rba-connect4-lazy-smp-host.mjs','addons/rba-connect4-lazy-smp-worker.mjs',
  'addons/rba-connect4-shared-exact-cache.mjs','experiments/cpc-factorial/isomax-node-counts.mjs',
  'experiments/worker-scaling/loader.mjs','experiments/worker-scaling/sample.mjs','experiments/worker-scaling/campaign.mjs'];
writeFileSync(resolve(out,'manifest.json'),JSON.stringify({sha,node:process.version,arms,roots,rounds:3,workers:[1,2,3,4],
  shared:1048576,privatePerWorker:1048576,sharedSampleMask:density?'per-arm':7,started:new Date().toISOString(),
  scope:'Completed-solve worker-scaling diagnostics. No memory selection. Test loader admits one native worker and cold timestamps; existing all-worker node loader.',
  hashes:Object.fromEntries(files.map(f=>[f,createHash('sha256').update(readFileSync(f)).digest('hex')]))},null,2)+'\n');
let n=0;
for(let round=0;round<3;round++)for(const [moves,expected] of roots)for(const arm of round%2?[...arms].reverse():arms){
  assert.equal(git('rev-parse','HEAD'),sha);
  const env={...process.env};delete env.SCALE_NO_SHARE;delete env.SCALE_ORDER;
  if(arm.noShare)env.SCALE_NO_SHARE='1';if(arm.order!==undefined)env.SCALE_ORDER=String(arm.order);
  const c={...arm,moves,timeoutMs:30000},p=spawnSync(process.execPath,['--experimental-ffi','--import',
    pathToFileURL(resolve('experiments/worker-scaling/loader.mjs')).href,'experiments/worker-scaling/sample.mjs',JSON.stringify(c)],
    {env,encoding:'utf8',timeout:50000,maxBuffer:2*1024*1024});
  appendFileSync(resolve(out,'processes.jsonl'),JSON.stringify({round,config:c,exit:p.status,error:p.error?.message,stdout:p.stdout,stderr:p.stderr})+'\n');
  assert.equal(p.status,0,p.stderr);
  const r={...JSON.parse(p.stdout.trim()),round,expected};appendFileSync(resolve(out,'samples.jsonl'),JSON.stringify(r)+'\n');
  assert.equal(r.status,'EXACT');assert.equal(r.rootWdl,expected);assert.equal(r.cleanup,true);assert.equal(r.workersExited,arm.workers);
  assert.equal(r.errors.length,0);assert.ok(r.workerTiming.every(t=>t[0]>0));
  if(arm.noShare){assert.equal(r.sharedCacheStores,0);assert.equal(r.sharedCacheHits,0);}
  n++;console.log(JSON.stringify({n,round,id:arm.id,moves,ms:r.wallMs,searchMs:r.firstSearchToResultMs,nodes:r.totalNodes,winner:r.winner}));
}
writeFileSync(resolve(out,'complete.json'),JSON.stringify({trials:n})+'\n');
