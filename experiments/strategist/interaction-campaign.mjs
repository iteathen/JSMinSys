// Sequential staged screen. Every adaptive selection is persisted before use.
import {mkdirSync,writeFileSync,appendFileSync,readFileSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {cpus} from 'node:os';
import assert from 'node:assert/strict';
const here=dirname(fileURLToPath(import.meta.url)),out=resolve(process.argv[2]),git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
assert.equal(git('status','--porcelain'),'');const sha=git('rev-parse','HEAD');mkdirSync(out);
const roots=['2053635233350500','1320461024522311','132046102452231'],rows=[];
const save=(name,x)=>writeFileSync(resolve(out,name),JSON.stringify(x,null,2)+'\n');
const files=['host.mjs','evaluator.mjs','strategist.mjs','mode-policy.mjs','modes.generated.mjs','observed-modes.generated.mjs','pool-policy.mjs','interaction-sample.mjs','interaction-campaign.mjs'];
save('manifest.json',{sha,node:process.version,v8:process.versions.v8,cpu:cpus()[0].model,started:new Date().toISOString(),roots,
  timeoutMs:750,warmups:20,cadenceMs:5,maxTrials:258,
  hashes:Object.fromEntries(files.map(f=>[f,createHash('sha256').update(readFileSync(resolve(here,f))).digest('hex')])),
  primary:'Ready barrier to first exact completion; validate after join. No timeout rankings.',qualification:'EXPERIMENTAL_SCREEN'});
const memories=[['base',4096,16384],['private2',8192,16384],['shared2',4096,32768],['both2',8192,32768]];
const cfg=(id,workers,m,strategy='modes-deep',initialActive=null)=>({id,workers,localCapacity:m[1],sharedCapacity:m[2],strategy,initialActive});
function trial(stage,c,root,round){
  assert.equal(git('rev-parse','HEAD'),sha);
  const started=new Date().toISOString(),p=spawnSync(process.execPath,['--experimental-ffi',resolve(here,'interaction-sample.mjs'),JSON.stringify(c),root],{encoding:'utf8',timeout:20000,maxBuffer:8*1024*1024});
  appendFileSync(resolve(out,'processes.jsonl'),JSON.stringify({stage,id:c.id,root,round,started,exit:p.status,error:p.error?.message,stdout:p.stdout,stderr:p.stderr})+'\n');
  if(p.status!==0)throw Error('sample failed; no retry');
  const r={...JSON.parse(p.stdout.trim()),stage,round};rows.push(r);appendFileSync(resolve(out,'samples.jsonl'),JSON.stringify(r)+'\n');
  assert.ok(r.cleanup&&!r.forcedTerminations&&!r.errors.length,JSON.stringify(r.errors));
  if(r.status==='EXACT')assert.equal(r.value,1);else{assert.equal(r.status,'TIMEOUT');assert.equal(r.value,null);}
  console.log(JSON.stringify({stage,round,id:c.id,root,ms:r.solveWallMs,status:r.status,active:r.evaluators.filter(e=>e.activated).length}));
}
function stage(name,configs){
  save(name+'-configs.json',configs);
  for(let round=0;round<2;round++)for(let k=0;k<3;k++){
    const root=roots[(k+round)%3],order=round?[...configs].reverse():configs;
    for(const c of order)trial(name,c,root,round);
  }
  save(name+'-complete.json',{trials:rows.filter(r=>r.stage===name).length});
}
const median=xs=>{xs=[...xs].sort((a,b)=>a-b);return (xs[(xs.length-1)>>1]+xs[xs.length>>1])/2;};
function score(stage,id){const rs=rows.filter(r=>r.stage===stage&&r.config.id===id);if(rs.length!==6||rs.some(r=>r.status!=='EXACT'))return Infinity;return Math.exp(rs.reduce((s,r)=>s+Math.log(r.solveWallMs),0)/rs.length);}
const resources=[cfg('w1-base',1,memories[0]),...[2,4,8].flatMap(w=>memories.map(m=>cfg('w'+w+'-'+m[0],w,m)))];
stage('resources',resources);
const selected={};
for(const w of [4,8])selected[w]=resources.filter(c=>c.workers===w).sort((a,b)=>score('resources',a.id)-score('resources',b.id))[0];
save('selected-memory.json',selected);
const profiles=[...Object.values(selected)].flatMap(c=>['modes-deep','modes-wide-helper','modes-wide-anchor','modes-wide-odd','modes-wide-even'].map(strategy=>({...c,id:'w'+c.workers+'-'+strategy,strategy})));
stage('profiles',profiles);
const dynamic=[...Object.values(selected)].flatMap(c=>[
  {...c,id:'w'+c.workers+'-fixed1',initialActive:1,strategy:'modes-pending-pool-fixed'},
  {...c,id:'w'+c.workers+'-fixedAll',initialActive:c.workers,strategy:'modes-pending-pool-fixed'},
  {...c,id:'w'+c.workers+'-grow1',initialActive:1,strategy:'modes-pending-pool-grow'},
  {...c,id:'w'+c.workers+'-grow2',initialActive:2,strategy:'modes-pending-pool-grow'}]);
stage('dynamic',dynamic);
const candidates=[];
function nominate(stage,configs,controlFor){
  const eligible=[];
  for(const c of configs){const control=controlFor(c);if(!control||control.id===c.id)continue;
    const ratio=score(stage,c.id)/score(stage,control.id);if(!Number.isFinite(ratio)||ratio>.99)continue;
    const rootRatios=roots.map(root=>median(rows.filter(r=>r.stage===stage&&r.config.id===c.id&&r.root===root).map(r=>r.solveWallMs))/median(rows.filter(r=>r.stage===stage&&r.config.id===control.id&&r.root===root).map(r=>r.solveWallMs)));
    if(rootRatios.some(r=>r>1.05))continue;eligible.push({family:stage,candidate:c,control,ratio,rootRatios});
  }
  eligible.sort((a,b)=>a.ratio-b.ratio);if(eligible.length)candidates.push(eligible[0]);
}
nominate('resources',resources,c=>resources.find(b=>b.id==='w'+c.workers+'-base'));
nominate('profiles',profiles,c=>profiles.find(b=>b.id==='w'+c.workers+'-modes-deep'));
nominate('dynamic',dynamic,c=>dynamic.find(b=>b.id==='w'+c.workers+'-fixed1'));
save('holdout-selection.json',candidates);
for(const pair of candidates)for(let round=0;round<4;round++)for(const root of roots){
  const mirror=[...root].map(c=>6-Number(c)).join('');
  for(const c of round%2?[pair.candidate,pair.control]:[pair.control,pair.candidate])trial('holdout-'+pair.family,c,mirror,round);
}
save('complete.json',{trials:rows.length,holdoutFamilies:candidates.length,exact:rows.filter(r=>r.status==='EXACT').length,timeouts:rows.filter(r=>r.status==='TIMEOUT').length});
