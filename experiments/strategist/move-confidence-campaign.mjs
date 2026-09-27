import {Worker} from 'node:worker_threads';
import {mkdirSync,writeFileSync,appendFileSync,readFileSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {cpus} from 'node:os';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../../addons/rba-connect4-geometry.mjs';
import {makeCorpus} from './move-confidence.mjs';
import locked from '../worker-scaling/locked-profile.json' with {type:'json'};
const out=resolve(process.argv[2]),git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
assert.equal(git('status','--porcelain'),'');const sha=git('rev-parse','HEAD');mkdirSync(out);
const save=(f,x)=>writeFileSync(resolve(out,f),JSON.stringify(x,null,2)+'\n');
const corpus=makeCorpus(prepareConnect4RbaGeometry({columns:7,rows:6}),{plies:[16,20,24,28,32],perPly:16,seed:0x729411});
corpus.push(...['2053635233350500','1320461024522311'].map((s,i)=>({id:'diagnostic-'+i,split:'diagnostic',moves:[...s].map(Number)})));
save('corpus.json',corpus);
const files=['move-confidence.mjs','move-confidence-label-worker.mjs','move-confidence-campaign.mjs',
  'frontier.generated.mjs','controls.mjs'];
save('manifest.json',{sha,started:new Date().toISOString(),node:process.version,v8:process.versions.v8,cpu:cpus()[0].model,
  locked,corpusSeed:0x729411,randomPositions:80,diagnostics:2,labelDeadlineMs:5000,
  thresholds:{tied:0,near:1,clear:'>=2'},
  distribution:'Uniform legal-action walks rejected if a win occurs by target ply; physical boards deduplicated including mirrors. Not representative of solver visitation.',
  performanceSelection:'First two complete holdout positions per gap bin with >1 CPC-eligible choices, nonexact CPC interval, and 200..2000000 root label nodes; plus A/B diagnostics. Selection uses features/work magnitude, not optimality or probe timings.',
  performanceScope:'Matched existing root probe vs released root wrapper; fixed commands, no live strategist. Worker 0 probes, peers deep. No new trigger overhead measured or production promotion.',
  hashes:Object.fromEntries(files.map(f=>[f,createHash('sha256').update(readFileSync(new URL(f,import.meta.url))).digest('hex')]))});
const labels=[];
for(const c of corpus){
  const r={...c,status:'INCOMPLETE',events:[]};
  await new Promise((resolveLabel,reject)=>{
    const w=new Worker(new URL('./move-confidence-label-worker.mjs',import.meta.url),{workerData:c});let expired=false,error=null;
    const timer=setTimeout(()=>{expired=true;w.terminate();},5000);
    w.on('message',m=>{r.events.push(m);if(m.type==='features')r.features=m.features;if(m.type==='root')Object.assign(r,m);
      if(m.type==='complete'){r.status='COMPLETE';r.values=m.values;r.ranks=m.ranks;}});
    w.on('error',e=>{error=e.stack;});
    w.on('exit',code=>{clearTimeout(timer);r.exitCode=code;r.cleanup=true;
      if(error){r.status='FAILED';r.error=error;}else if(expired&&r.status!=='COMPLETE')r.status='TIMEOUT';
      else if(code!==0||r.status!=='COMPLETE'){r.status='FAILED';r.error='unexpected label-worker exit';}
      appendFileSync(resolve(out,'labels.jsonl'),JSON.stringify(r)+'\n');
      if(r.status==='FAILED')reject(Error(r.error));else resolveLabel();});
  });
  labels.push(r);console.log(JSON.stringify({id:r.id,status:r.status,group:r.features?.group,choices:r.features?.choices,rootNodes:r.rootNodes,rank:r.ranks?.firstOptimalRank}));
}
const selected=[];
for(const group of ['tied','near','clear'])selected.push(...labels.filter(r=>r.status==='COMPLETE'&&r.split==='holdout'&&
  r.features.group===group&&r.features.choices>1&&r.features.cpcInterval[0]!==r.features.cpcInterval[1]&&r.rootNodes>=200&&r.rootNodes<=2000000).slice(0,2));
selected.push(...labels.filter(r=>r.status==='COMPLETE'&&r.split==='diagnostic'));
save('selected.json',selected.map(r=>({id:r.id,moves:r.moves,features:r.features,rootValue:r.value,rootNodes:r.rootNodes})));
let samples=0;
for(const workers of [1,7])for(let round=0;round<3;round++)for(const r of selected){
  for(const arm of round%2?['probe','probe-deep']:['probe-deep','probe']){
    assert.equal(git('rev-parse','HEAD'),sha);
    const config={...locked.options,workers,moves:r.moves.map(c=>c+1).join(''),timeoutMs:30000};
    const env={...process.env,ISOMAX_WIDE_PATH:arm};delete env.SCALE_NO_SHARE;delete env.SCALE_ORDER;
    const p=spawnSync(process.execPath,['--experimental-ffi','--import',pathToFileURL(resolve('experiments/worker-scaling/wide-path-loader.mjs')).href,
      'experiments/worker-scaling/sample.mjs',JSON.stringify(config)],{env,encoding:'utf8',timeout:50000,maxBuffer:4*1024*1024});
    appendFileSync(resolve(out,'processes.jsonl'),JSON.stringify({id:r.id,workers,round,arm,exit:p.status,error:p.error?.message,stdout:p.stdout,stderr:p.stderr})+'\n');
    assert.equal(p.status,0,'sample failed; no retry');
    const sample={...JSON.parse(p.stdout.trim()),id:r.id,split:r.split,group:r.features.group,round,arm};
    appendFileSync(resolve(out,'samples.jsonl'),JSON.stringify(sample)+'\n');
    assert.equal(sample.cleanup,true);assert.deepEqual(sample.errors,[]);assert.equal(sample.workersExited,workers);
    if(sample.status==='EXACT')assert.equal(sample.rootWdl,r.value-2);else{assert.equal(sample.status,'TIMEOUT');assert.equal(sample.rootWdl,null);}
    samples++;console.log(JSON.stringify({id:r.id,workers,round,arm,status:sample.status,ms:sample.wallMs,nodes:sample.totalNodes}));
  }
}
save('complete.json',{labels:labels.length,completed:labels.filter(r=>r.status==='COMPLETE').length,samples});
