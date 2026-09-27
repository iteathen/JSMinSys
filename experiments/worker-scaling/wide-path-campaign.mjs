import {mkdirSync,writeFileSync,appendFileSync,readFileSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import profile from './locked-profile.json' with {type:'json'};
const out=resolve(process.argv[2]),git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim(),sha=git('rev-parse','HEAD');
assert.equal(git('status','--porcelain'),'');mkdirSync(out);
const arms=['native','poll','mode','deep-ablation'],stages=[
  {id:'matched-single',workers:1,rounds:4,moves:'353335714',expected:-1},
  {id:'locked-seven',workers:7,rounds:5,moves:'353335714',expected:-1}
];
const files=['addons/rba-connect4-alphabeta.mjs','addons/rba-connect4-alphabeta-behavior.mjs',
  'addons/worker-behavior.mjs','addons/worker-behavior-search.mjs','addons/rba-connect4-lazy-smp-host.mjs',
  'addons/rba-connect4-lazy-smp-worker.mjs','experiments/strategist/modes.generated.mjs','experiments/strategist/mode-controls.mjs',
  'experiments/worker-scaling/locked-profile.json','experiments/worker-scaling/sample.mjs',
  'experiments/worker-scaling/loader.mjs','experiments/worker-scaling/wide-path-loader.mjs',
  'experiments/cpc-factorial/isomax-node-counts.mjs','experiments/worker-scaling/wide-path-campaign.mjs'];
writeFileSync(resolve(out,'manifest.json'),JSON.stringify({sha,node:process.version,profile,arms,stages,started:new Date().toISOString(),
  scope:'Dormant-path ablation; all flags zero, no strategist. Ablation cannot accept live shallow commands.',
  hashes:Object.fromEntries(files.map(f=>[f,createHash('sha256').update(readFileSync(f)).digest('hex')]))},null,2)+'\n');
let count=0;
for(const stage of stages)for(let round=0;round<stage.rounds;round++){
  const order=arms.map((_,i)=>arms[(i+round)%arms.length]);if(round%2)order.reverse();
  const current={};
  for(const arm of order){
    assert.equal(git('rev-parse','HEAD'),sha);
    const config={...profile.options,workers:stage.workers,moves:stage.moves,timeoutMs:30000,widePath:arm},
      env={...process.env,ISOMAX_WIDE_PATH:arm};delete env.SCALE_NO_SHARE;delete env.SCALE_ORDER;
    const p=spawnSync(process.execPath,['--experimental-ffi','--import',pathToFileURL(resolve('experiments/worker-scaling/wide-path-loader.mjs')).href,
      'experiments/worker-scaling/sample.mjs',JSON.stringify(config)],{env,encoding:'utf8',timeout:50000,maxBuffer:4*1024*1024});
    appendFileSync(resolve(out,'processes.jsonl'),JSON.stringify({stage:stage.id,round,arm,exit:p.status,error:p.error?.message,stdout:p.stdout,stderr:p.stderr})+'\n');
    assert.equal(p.status,0,p.stderr);
    const r={...JSON.parse(p.stdout.trim()),stage:stage.id,round,arm,expected:stage.expected};
    appendFileSync(resolve(out,'samples.jsonl'),JSON.stringify(r)+'\n');current[arm]=r;
    assert.equal(r.status,'EXACT');assert.equal(r.rootWdl,stage.expected);assert.equal(r.cleanup,true);
    assert.equal(r.workersExited,stage.workers);assert.equal(r.errors.length,0);
    count++;console.log(JSON.stringify({count,stage:stage.id,round,arm,ms:r.wallMs,nodes:r.totalNodes,cycles:r.solveCycles}));
  }
  if(stage.workers===1){
    assert.equal(current.native.totalNodes,current.poll.totalNodes,'polling changed work');
    assert.equal(current.mode.totalNodes,current['deep-ablation'].totalNodes,'ablation changed work');
    assert.equal(current.mode.move,current['deep-ablation'].move);
  }
}
writeFileSync(resolve(out,'complete.json'),JSON.stringify({count,finished:new Date().toISOString()})+'\n');
