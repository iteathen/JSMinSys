// Same-runner ABBA controller. Baseline A/A uses the same checkout for both arms;
// future candidate screens can pass distinct clean checkout paths.
import {appendFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {cpus,platform,release} from 'node:os';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync,spawnSync} from 'node:child_process';

const [outputArg,baselineArg,candidateArg,cacheMode='local',moves='45461667',blocksArg='6']=process.argv.slice(2);
if(!outputArg||!baselineArg||!candidateArg) throw new Error('usage: node run.mjs OUTPUT BASELINE CANDIDATE local|shared MOVES BLOCKS');
if(!['local','shared'].includes(cacheMode)) throw new RangeError('cache mode must be local|shared');
const blocks=Number(blocksArg);
if(!Number.isInteger(blocks)||blocks<2||blocks>16) throw new RangeError('blocks must be 2..16');

const output=resolve(outputArg),baseline=resolve(baselineArg),candidate=resolve(candidateArg);
if(existsSync(output)) throw new Error('output directory already exists');
mkdirSync(output,{recursive:true});
const here=dirname(fileURLToPath(import.meta.url)),sample=resolve(here,'sample.mjs');
const git=(dir,...args)=>execFileSync('git',['-C',dir,...args],{encoding:'utf8'}).trim();
const snapshot=dir=>({path:dir,sha:git(dir,'rev-parse','HEAD'),dirty:!!git(dir,'status','--porcelain')});
const a=snapshot(baseline),b=snapshot(candidate);
writeFileSync(resolve(output,'manifest.json'),JSON.stringify({
  kind:'isomax-hotloop-baseline-manifest-v1',
  cacheMode,moves,blocks,sequence:'ABBA',
  baseline:a,candidate:b,noiseCalibration:a.sha===b.sha,
  runner:{cpu:cpus()[0]?.model??null,platform:platform(),release:release(),node:process.version,v8:process.versions.v8},
  primary:'solveCycles; cyclesPerNode is diagnostic unless search work is invariant',
  scope:'single evaluator; root import/state/cache allocation excluded; first solve includes JIT; no Lazy-SMP scheduling',
},null,2)+'\n');
if(a.dirty||b.dirty) throw new Error('both library checkouts must be clean');

const samples=[];
for(let block=0;block<blocks;block++){
  for(const arm of ['A','B','B','A']){
    const source=arm==='A'?a:b,library=arm==='A'?baseline:candidate;
    const current=snapshot(library);
    if(current.dirty||current.sha!==source.sha) throw new Error('library changed during campaign');
    const child=spawnSync(process.execPath,['--experimental-ffi',sample,library,cacheMode,moves],{
      encoding:'utf8',timeout:moves==='353335714'?90000:30000,maxBuffer:1024*1024,
    });
    appendFileSync(resolve(output,'processes.jsonl'),JSON.stringify({
      block,arm,source,exitCode:child.status,signal:child.signal,error:child.error?.message??null,
      stdout:child.stdout,stderr:child.stderr,
    })+'\n');
    if(child.status!==0) throw new Error('sample failed; raw output preserved');
    const row={...JSON.parse(child.stdout.trim()),block,arm};
    if(row.sourceSha!==source.sha) throw new Error('sample source identity mismatch');
    appendFileSync(resolve(output,'samples.jsonl'),JSON.stringify(row)+'\n');
    samples.push(row);
    console.log(JSON.stringify({block,arm,solveCycles:row.solveCycles,wallMs:row.wallMs,nodes:row.metrics.nodes,cyclesPerNode:row.cyclesPerNode}));
  }
}

const fields=['solveCycles','wallMs','cpuMs','cyclesPerNode'];
const t95=[null,null,12.706,4.303,3.182,2.776,2.571,2.447,2.365,2.306,2.262,2.228,2.201,2.179,2.160,2.145,2.131];
const stats={};
for(const field of fields){
  const ratios=[];
  for(let block=0;block<blocks;block++){
    const rows=samples.filter(x=>x.block===block),aa=rows.filter(x=>x.arm==='A'),bb=rows.filter(x=>x.arm==='B');
    const mean=xs=>xs.reduce((s,x)=>s+Number(x[field]),0)/xs.length;
    ratios.push(mean(bb)/mean(aa));
  }
  const mean=ratios.reduce((x,y)=>x+y,0)/ratios.length;
  const variance=ratios.reduce((s,x)=>s+(x-mean)**2,0)/(ratios.length-1);
  const se=Math.sqrt(variance/ratios.length),t=t95[blocks];
  stats[field]={blockRatios:ratios,meanDeltaPct:(mean-1)*100,
    interval95Pct:[(mean-t*se-1)*100,(mean+t*se-1)*100]};
}

const signature=row=>JSON.stringify({result:row.result,metrics:row.metrics,sharedStats:row.sharedStats});
const armA=[...new Set(samples.filter(x=>x.arm==='A').map(signature))];
const armB=[...new Set(samples.filter(x=>x.arm==='B').map(signature))];
if(armA.length!==1||armB.length!==1) throw new Error('non-deterministic search signature within an arm');
if(a.sha===b.sha&&armA[0]!==armB[0]) throw new Error('A/A calibration changed deterministic search work');

const summary={kind:'isomax-hotloop-baseline-summary-v1',cacheMode,moves,blocks,samples:samples.length,
  noiseCalibration:a.sha===b.sha,stats,
  deterministic:{armA:JSON.parse(armA[0]),armB:JSON.parse(armB[0])},
  interpretation:a.sha===b.sha
    ?'A/A calibration only: paired deltas estimate same-runner measurement noise; no speedup claim.'
    :'Candidate screen: preserve correctness first. For equal-work hot-loop changes, target <=0.5 cyclesPerNode and <=0.5 solveCycles; for changed search work, report total cycles, nodes and wall separately.'
};
writeFileSync(resolve(output,'summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify(summary));
