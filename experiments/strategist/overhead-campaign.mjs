import {mkdirSync,writeFileSync,appendFileSync,readFileSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {cpus} from 'node:os';
import assert from 'node:assert/strict';
const here=dirname(fileURLToPath(import.meta.url)),out=resolve(process.argv[2]);
const git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
assert.equal(git('status','--porcelain'),'');const sha=git('rev-parse','HEAD');mkdirSync(out);
const save=(name,data)=>writeFileSync(resolve(out,name),JSON.stringify(data,null,2)+'\n');
const short=(id,policy,strategy=null)=>({id,policy,strategy,workers:1,initialActive:null,localCapacity:4096,sharedCapacity:16384,timeoutMs:750});
const controls=[short('bare','bare'),short('stop-host','host-only'),short('stop-strategist','poll-only'),
  short('mode-deep','inert','modes-deep'),short('observed-off','inert','modes-pending-off'),short('observed-read','inert','modes-pending-read')];
const hard=(id,strategy,initialActive=null)=>({id,policy:'inert',strategy,workers:4,initialActive,localCapacity:4096,sharedCapacity:32768,timeoutMs:5000});
const candidates=[hard('deep4','modes-deep'),hard('wide0-deep3','modes-wide-anchor'),
  hard('minimal-fixed1','modes-pool-fixed',1),hard('minimal-fixed4','modes-pool-fixed',4),
  hard('observed-fixed1','modes-pending-pool-fixed',1),hard('observed-grow1','modes-pending-pool-grow',1)];
const stages=[{name:'overhead',rounds:4,roots:[['A','2053635233350500',1],['B','1320461024522311',1]],configs:controls},
  {name:'hard',rounds:3,roots:[['F45461667','34350556',3],['empty','',3]],configs:candidates}];
const files=['host.mjs','evaluator.mjs','strategist.mjs','modes.generated.mjs','observed-modes.generated.mjs',
  'mode-controls.mjs','observed-mode-controls.mjs','pending-observation.mjs','overhead-sample.mjs','overhead-campaign.mjs'];
save('manifest.json',{sha,node:process.version,v8:process.versions.v8,cpu:cpus()[0].model,started:new Date().toISOString(),stages,
  warmups:20,cadenceMs:5,maxTrials:84,qualification:'EXPERIMENTAL_DIAGNOSTIC',
  hashes:Object.fromEntries(files.map(f=>[f,createHash('sha256').update(readFileSync(resolve(here,f))).digest('hex')]))});
let count=0,solved=0,timeouts=0;
for(const stage of stages){
  for(let round=0;round<stage.rounds;round++)for(const [key,root,expected] of stage.roots){
    const shifted=stage.configs.map((_,i)=>stage.configs[(i+round)%stage.configs.length]);
    const order=round%2?shifted.reverse():shifted;
    for(const config of order){
      assert.equal(git('rev-parse','HEAD'),sha);
      const p=spawnSync(process.execPath,['--experimental-ffi',resolve(here,'overhead-sample.mjs'),JSON.stringify(config),root],
        {encoding:'utf8',timeout:20000,maxBuffer:8*1024*1024});
      appendFileSync(resolve(out,'processes.jsonl'),JSON.stringify({stage:stage.name,round,key,id:config.id,exit:p.status,error:p.error?.message,stdout:p.stdout,stderr:p.stderr})+'\n');
      assert.equal(p.status,0,'subprocess failure; no retry');
      const r={...JSON.parse(p.stdout.trim()),stage:stage.name,round,key,expected};
      appendFileSync(resolve(out,'samples.jsonl'),JSON.stringify(r)+'\n');count++;
      assert.ok(r.cleanup&&!r.forcedTerminations&&!r.errors.length,JSON.stringify(r.errors));
      if(r.status==='EXACT'){assert.equal(r.value,expected);solved++;}
      else{assert.equal(r.status,'TIMEOUT');assert.equal(r.value,null);timeouts++;}
      if(stage.name==='overhead')assert.equal(r.status,'EXACT','overhead requires completed matched work');
      console.log(JSON.stringify({stage:stage.name,round,key,id:config.id,status:r.status,ms:r.solveWallMs,nodes:r.nodes,active:r.evaluators.filter(e=>e.activated).length}));
    }
  }
  save(stage.name+'-complete.json',{count,solved,timeouts});
}
save('complete.json',{count,solved,timeouts});
