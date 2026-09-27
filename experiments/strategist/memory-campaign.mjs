import {mkdirSync,writeFileSync,appendFileSync,readFileSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {cpus} from 'node:os';
import assert from 'node:assert/strict';
const here=dirname(fileURLToPath(import.meta.url)),out=resolve(process.argv[2]),git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
assert.equal(git('status','--porcelain'),'');const sha=git('rev-parse','HEAD');mkdirSync(out);
const save=(name,x)=>writeFileSync(resolve(out,name),JSON.stringify(x,null,2)+'\n');
const arm=(shared,local,timeoutMs=5000)=>({id:`S${shared/1024}K-P${local/1024}K`,shared,local,timeoutMs});
const diagonal=[65536,262144,524288,1048576,2097152].map(n=>arm(n,n));
const axes=[arm(1048576,1048576),...[262144,524288,2097152].flatMap(n=>[arm(n,1048576),arm(1048576,n)])];
const stress=[...diagonal,arm(262144,1048576),arm(1048576,262144)].map(c=>({...c,timeoutMs:30000}));
const roots=[['F45461667','34350556',1],['A','2053635233350500',-1],['B','1320461024522311',-1]];
const stressOnly=process.argv[3]==='--stress-only';
const sustained=process.argv[3]==='--sustained';
const repetitions=sustained?1:2;
const stages=sustained?[{name:'stress',configs:[1048576,524288,2097152].map(n=>arm(n,n,300000)),roots:[['empty','',1]]}]:[{name:'diagonal',configs:diagonal,roots},{name:'axes',configs:axes,roots},{name:'stress',configs:stress,roots:[['empty','',1]]}].filter(s=>!stressOnly||s.name==='stress');
const files=['memory-sample.mjs','memory-config.mjs','memory-campaign.mjs','../cpc-factorial/isomax-node-counts.mjs',
  '../../addons/rba-connect4-alphabeta.mjs','../../addons/rba-connect4-lazy-smp-host.mjs','../../addons/rba-connect4-lazy-smp-worker.mjs','../../addons/rba-connect4-shared-exact-cache.mjs'];
save('manifest.json',{sha,node:process.version,v8:process.versions.v8,cpu:cpus()[0].model,started:new Date().toISOString(),
  workers:4,sharedSampleMask:7,stages,repetitions,maxTrials:sustained?3:stressOnly?14:86,stressOnly,sustained,
  hashes:Object.fromEntries(files.map(f=>[f,createHash('sha256').update(readFileSync(resolve(here,f))).digest('hex')])),
  historicalResearch:'Connect4@12b76d3b7f5fac7c7cd6a9c4ec31e3ee37e1078c',
  scope:sustained?'Five-minute empty-board memory knee bracket; one sample per size, no solve-time optimum claim.':'Short diagnostics only; superseded for memory selection by sustained campaign.'});
let trials=0,solved=0,timeouts=0;
for(const stage of stages){
  for(let round=0;round<repetitions;round++)for(const [key,root,expectedWdl] of stage.roots){
    // Opposite order balances first/last exposure. No concurrent solver samples.
    for(const config of round?[...stage.configs].reverse():stage.configs){
      assert.equal(git('rev-parse','HEAD'),sha);
      const args=['--experimental-ffi'];
      if(stage.name==='stress')args.push('--import',pathToFileURL(resolve(here,'../cpc-factorial/isomax-node-counts.mjs')).href);
      args.push(resolve(here,'memory-sample.mjs'),JSON.stringify(config),root);
      const p=spawnSync(process.execPath,args,{encoding:'utf8',timeout:config.timeoutMs+20000,maxBuffer:4*1024*1024});
      appendFileSync(resolve(out,'processes.jsonl'),JSON.stringify({stage:stage.name,round,key,config,exit:p.status,error:p.error?.message,stdout:p.stdout,stderr:p.stderr})+'\n');
      assert.equal(p.status,0,'subprocess failure; no retry');
      const r={...JSON.parse(p.stdout.trim()),stage:stage.name,round,key,expectedWdl};
      appendFileSync(resolve(out,'samples.jsonl'),JSON.stringify(r)+'\n');trials++;
      assert.ok(r.cleanup&&r.workersExited===4&&!r.errors.length);
      assert.equal(BigInt(r.bootstrapCycles)+BigInt(r.setupCycles)+BigInt(r.solveCycles),BigInt(r.totalProcessCycles));
      if(r.status==='EXACT'){assert.equal(r.rootWdl,expectedWdl);solved++;}
      else{assert.equal(r.status,'TIMEOUT');assert.equal(r.rootWdl,null);timeouts++;}
      assert.equal(r.totalNodes!==null,stage.name==='stress');
      console.log(JSON.stringify({stage:stage.name,round,key,id:config.id,status:r.status,ms:r.wallMs,nodes:r.totalNodes,hits:r.sharedCacheHits}));
    }
  }
  save(stage.name+'-complete.json',{trials,solved,timeouts});
}
save('complete.json',{trials,solved,timeouts});
