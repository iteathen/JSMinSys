import {mkdirSync,writeFileSync,appendFileSync,readFileSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {cpus} from 'node:os';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const out=resolve(process.argv[2]),git=(...a)=>execFileSync('git',a,{encoding:'utf8'}).trim();
assert.equal(git('status','--porcelain'),'');
const sha=git('rev-parse','HEAD');mkdirSync(out);
const roots=['2053635233350500','1320461024522311','132046102452231'];
const arms=['native','read','sustained','growth','relative25','density'];
const files=['pending-policy.mjs','strategist.mjs','one-band.generated.mjs','one-band-controls.mjs',
  'pending-observation.mjs','pending-reader.mjs','host.mjs','evaluator.mjs','trigger-sample.mjs','trigger-campaign.mjs'];
writeFileSync(resolve(out,'manifest.json'),JSON.stringify({sha,roots,arms,workers:[1,7],rounds:3,
  node:process.version,v8:process.versions.v8,cpu:cpus()[0].model,date:new Date().toISOString(),
  localCapacity:1048576,sharedCapacity:4194304,sharedSampleMask:0,cadenceMs:5,timeoutMs:750,warmups:20,
  primary:'ready barrier to first exact result; total trial/process cycles and shutdown also charged',
  limits:'Mechanism screen on two historical roots plus a predecessor; not independent holdout or promotion. Native arm has existing behavior STOP poll. All active arms use identical one-band worker.',
  hashes:Object.fromEntries(files.map(f=>[f,createHash('sha256').update(readFileSync(new URL(f,import.meta.url))).digest('hex')]))},null,2)+'\n');
let trials=0;
for(const workers of [1,7])for(let round=0;round<3;round++)for(let k=0;k<roots.length;k++){
  const root=roots[(k+round)%roots.length];
  for(let j=0;j<arms.length;j++){
    const trigger=arms[(j+2*round+k)%arms.length],config={workers,root,trigger,round};
    assert.equal(git('rev-parse','HEAD'),sha);
    const p=spawnSync(process.execPath,['--experimental-ffi',fileURLToPath(new URL('trigger-sample.mjs',import.meta.url)),JSON.stringify(config)],
      {encoding:'utf8',timeout:20000,maxBuffer:16*1024*1024});
    appendFileSync(resolve(out,'processes.jsonl'),JSON.stringify({config,exit:p.status,error:p.error?.message,stdout:p.stdout,stderr:p.stderr})+'\n');
    assert.equal(p.status,0,'sample failed; no retry');
    const r=JSON.parse(p.stdout.trim());appendFileSync(resolve(out,'samples.jsonl'),JSON.stringify(r)+'\n');
    assert.deepEqual(r.errors,[]);assert.equal(r.cleanup,true);assert.equal(r.forcedTerminations,0);
    if(r.status==='EXACT'){
      assert.equal(r.value,1,'known absolute P1 win');
      if(workers===1)assert.equal(r.evaluators[0].result.move,root===roots[2]?1:3);
    }else{assert.equal(r.status,'TIMEOUT');assert.equal(r.value,null);}
    for(const e of r.evaluators){const m=e.result.metrics;
      if(m.bandStarted!==undefined){assert.ok(m.bandStarted>=m.bandCompleted&&m.bandStarted-m.bandCompleted<=1);assert.equal(m.modeRegions,m.bandStarted);}
    }
    trials++;console.log(JSON.stringify({workers,round,root,trigger,status:r.status,ms:r.solveWallMs,nodes:r.nodes,
      triggers:r.strategist?.pendingPolicies?.reduce((s,p)=>s+p.triggers,0)??0}));
  }
}
writeFileSync(resolve(out,'complete.json'),JSON.stringify({trials})+'\n');
