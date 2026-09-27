// Cold campaign controller. Samples are sequential; no overlapping benchmarks.
import {mkdirSync,writeFileSync,appendFileSync,readFileSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {validateCycleSample} from '../cpc-factorial/isomax-cycle-analysis.mjs';
const here=dirname(fileURLToPath(import.meta.url)),out=resolve(process.argv[2]),
  dirs=['full','exhaustion','response','both'].map(n=>'C:/r/cpc-factorial-'+n),orders=['ABDC','BCAD','CDBA','DACB'];
const git=(dir,...args)=>execFileSync('git',['-C',dir,...args],{encoding:'utf8'}).trim();
const sources=dirs.map(dir=>({dir,sha:git(dir,'rev-parse','HEAD')}));
mkdirSync(out);
const files=['run.mjs','serial-sample.mjs','phase-hook.mjs','../cpc-factorial/isomax-cycle-sample.mjs','../cpc-factorial/cycle-counter.mjs'];
writeFileSync(resolve(out,'manifest.json'),JSON.stringify({sources,orders,blocks:8,controllerSha:git(here,'rev-parse','HEAD'),
  started:new Date().toISOString(),node:process.version,primary:{serial:'solveCycles',parallel:'wallMs (accepted API result after cleanup)'},
  hashes:Object.fromEntries(files.map(f=>[f,createHash('sha256').update(readFileSync(resolve(here,f))).digest('hex')])),
  samples:{serial:32,parallel:32,phaseDiagnostic:8},promotion:'SCREEN_ONLY'},null,2)+'\n');
function run(mode,block,arm){
  const source=sources[arm.charCodeAt(0)-65];
  assert.equal(git(source.dir,'status','--porcelain'),'');assert.equal(git(source.dir,'rev-parse','HEAD'),source.sha);
  const diagnostic=mode==='phase',serial=mode==='serial',
    args=['--experimental-ffi',...(diagnostic?['--import',pathToFileURL(resolve(here,'phase-hook.mjs')).href]:[]),
      resolve(here,serial?'serial-sample.mjs':'../cpc-factorial/isomax-cycle-sample.mjs'),source.dir,'45461667'],
    started=new Date().toISOString(),r=spawnSync(process.execPath,args,{encoding:'utf8',timeout:serial?30000:45000,maxBuffer:4*1024*1024});
  appendFileSync(resolve(out,'processes.jsonl'),JSON.stringify({mode,arm,block,started,exit:r.status,error:r.error?.message,stdout:r.stdout,stderr:r.stderr})+'\n');
  if(r.status!==0)throw Error('sample failed; evidence retained; no retry');
  const s={...JSON.parse(r.stdout.trim()),mode,block,arm};
  appendFileSync(resolve(out,mode+'.jsonl'),JSON.stringify(s)+'\n');
  if(serial){
    assert.ok(s.oracleMatched&&!s.libraryDirty);assert.equal(s.librarySha,source.sha);
    assert.equal(BigInt(s.bootstrapCycles)+BigInt(s.setupCycles)+BigInt(s.solveCycles),BigInt(s.totalProcessCycles));
    assert.ok(s.nodes>0&&Number(s.solveCycles)>0&&s.wallMs>0);
  }else validateCycleSample(s,source.sha,'production');
  console.log(JSON.stringify({mode,arm,block,wallMs:s.wallMs,solveCycles:s.solveCycles}));
}
for(let b=0;b<8;b++)for(const mode of b%2?['parallel','serial']:['serial','parallel'])for(const arm of orders[b%4])run(mode,b,arm);
for(let b=0;b<2;b++)for(const arm of b?'DCBA':'ABCD')run('phase',b,arm);
writeFileSync(resolve(out,'complete.json'),JSON.stringify({serial:32,parallel:32,phase:8})+'\n');
