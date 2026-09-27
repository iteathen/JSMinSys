// COLD factorial controller. Production measurement helpers are pinned copies.
import {mkdirSync,writeFileSync,appendFileSync,readFileSync} from 'node:fs';
import {execFileSync,spawnSync} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {validateCycleSample} from './isomax-cycle-analysis.mjs';

const here=dirname(fileURLToPath(import.meta.url)),output=resolve(process.argv[2]);
const dirs=['full','exhaustion','response','both'].map(n=>'C:/r/cpc-factorial-'+n);
const git=(dir,...args)=>execFileSync('git',['-C',dir,...args],{encoding:'utf8'}).trim();
const identity=dir=>({dir,sha:git(dir,'rev-parse','HEAD'),dirty:!!git(dir,'status','--porcelain')});
const sources=dirs.map(identity),orders=['ABDC','BCAD','CDBA','DACB'];
mkdirSync(output);
const files=['run.mjs','isomax-cycle-sample.mjs','isomax-cycle-analysis.mjs','cycle-counter.mjs','isomax-node-counts.mjs'];
const hashes=Object.fromEntries(files.map(n=>[n,createHash('sha256').update(readFileSync(resolve(here,n))).digest('hex')]));
writeFileSync(resolve(output,'manifest.json'),JSON.stringify({sources,orders,blocks:8,hashes,node:process.version,
  harnessOrigin:'iteathen/Connect4@7a1a41665d3f5b1a679c16598d60ae3d1035706d',
  controllerSha:git(here,'rev-parse','HEAD'),started:new Date().toISOString(),
  cycleBoundary:'Process creation through joined solve; all process threads. Excludes subsequent report output and parent controller.',
  productionSamples:32,instrumentedDiagnosticSamples:8,promotion:'NOT_QUALIFIED_BY_SCREEN'},null,2)+'\n');
if(sources.some(s=>s.dirty))throw Error('dirty library');
const samples=[];
function run(arm,block,instrumented){
  const source=sources[arm.charCodeAt(0)-65],now=identity(source.dir);
  if(now.sha!==source.sha||now.dirty)throw Error('source changed');
  const args=['--experimental-ffi',...(instrumented?['--import',pathToFileURL(resolve(here,'isomax-node-counts.mjs')).href]:[]),
    resolve(here,'isomax-cycle-sample.mjs'),source.dir,'45461667'];
  const started=new Date().toISOString(),r=spawnSync(process.execPath,args,{encoding:'utf8',timeout:45000,maxBuffer:4*1024*1024});
  appendFileSync(resolve(output,'processes.jsonl'),JSON.stringify({arm,block,instrumented,started,exit:r.status,error:r.error?.message,stdout:r.stdout,stderr:r.stderr})+'\n');
  if(r.status!==0)throw Error('sample failed; raw output retained; no retry');
  const s={...JSON.parse(r.stdout.trim()),arm,block};
  appendFileSync(resolve(output,instrumented?'diagnostic.jsonl':'samples.jsonl'),JSON.stringify(s)+'\n');
  validateCycleSample(s,source.sha,instrumented?'all-worker-node-instrumentation':'production');
  if(!instrumented)samples.push(s);
  console.log(JSON.stringify({arm,block,instrumented,cycles:s.totalProcessCycles,wallMs:s.wallMs,nodes:s.totalNodes}));
}
for(let b=0;b<8;b++)for(const arm of orders[b%4])run(arm,b,false);
writeFileSync(resolve(output,'production-complete.json'),JSON.stringify({samples:samples.length})+'\n');
for(let b=0;b<2;b++)for(const arm of b?'DCBA':'ABCD')run(arm,b,true);
