import {mkdirSync,writeFileSync,appendFileSync,readFileSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {cpus} from 'node:os';
import assert from 'node:assert/strict';
const here=dirname(fileURLToPath(import.meta.url)),out=resolve(process.argv[2]),
  git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim(),sha=git('rev-parse','HEAD');
assert.equal(git('status','--porcelain'),'');mkdirSync(out);
const labels=['modes-deep','modes-wide-helper','modes-wide-anchor'],orders=['012','120','201','210','102','021'];
writeFileSync(resolve(out,'manifest.json'),JSON.stringify({sha,labels,orders,fixtures:{A:'2053635233350500',B:'1320461024522311',F:'34350556'},
  node:process.version,v8:process.versions.v8,cpu:cpus()[0].model,started:new Date().toISOString(),
  samples:54,workers:2,timeoutMs:750,warmups:20,localCapacity:4096,sharedCapacity:16384,
  hashes:Object.fromEntries(['host.mjs','evaluator.mjs','modes.generated.mjs','mode-controls.mjs','mode-policy.mjs','strategist.mjs','mixed-sample.mjs'].map(f=>[f,createHash('sha256').update(readFileSync(resolve(here,f))).digest('hex')])),
  primary:'First exact worker completion from ready barrier, validated after join',promotion:'NOT_QUALIFIED_BY_SCREEN'},null,2)+'\n');
for(let round=0;round<6;round++)for(let k=0;k<3;k++){
  const key=['A','B','F'][(round+k)%3];
  for(const id of orders[round]){
    const label=labels[Number(id)],started=new Date().toISOString();
    assert.equal(git('rev-parse','HEAD'),sha);
    const r=spawnSync(process.execPath,['--experimental-ffi',resolve(here,'mixed-sample.mjs'),label,key],{encoding:'utf8',timeout:20000,maxBuffer:8*1024*1024});
    appendFileSync(resolve(out,'processes.jsonl'),JSON.stringify({round,key,label,started,exit:r.status,error:r.error?.message,stdout:r.stdout,stderr:r.stderr})+'\n');
    if(r.status!==0)throw Error('sample process failed; no retry');
    const s={...JSON.parse(r.stdout.trim()),round};appendFileSync(resolve(out,'samples.jsonl'),JSON.stringify(s)+'\n');
    assert.notEqual(s.status,'FAILED',JSON.stringify(s.errors));assert.ok(s.cleanup);assert.equal(s.forcedTerminations,0);assert.deepEqual(s.errors,[]);
    if(s.status==='EXACT')assert.equal(s.value,s.expectedValue);else assert.equal(s.status,'TIMEOUT');
    const wide=label==='modes-wide-helper'?1:label==='modes-wide-anchor'?0:-1;
    if(wide<0)assert.ok(s.evaluators.every(e=>e.result.metrics.horizonStops===0));
    else {assert.ok(s.evaluators[wide].result.metrics.horizonStops>0);assert.equal(s.evaluators[wide^1].result.metrics.horizonStops,0);}
    console.log(JSON.stringify({round,key,label,status:s.status,solveMs:s.solveWallMs,nodes:s.nodes,hits:s.cacheStats[0]}));
  }
}
writeFileSync(resolve(out,'complete.json'),JSON.stringify({samples:54})+'\n');
