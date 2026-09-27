import {appendFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync,spawnSync} from 'node:child_process';

const [outArg,aArg,bArg,blocksArg='2']=process.argv.slice(2);
if(!outArg||!aArg||!bArg)throw Error('usage: node mw-hard-run.mjs OUTPUT CONTROL CANDIDATE BLOCKS');
const blocks=Number(blocksArg),timeoutMs=120000,moves='35333571';
if(!Number.isInteger(blocks)||blocks<1||blocks>4)throw RangeError('blocks 1..4');
const out=resolve(outArg);if(existsSync(out))throw Error('output exists');mkdirSync(out,{recursive:true});
const dirs={A:resolve(aArg),B:resolve(bArg)},labels={A:'stage9+plans',B:'zero-bounds+plans'},
  git=(d,...args)=>execFileSync('git',['-C',d,...args],{encoding:'utf8'}).trim(),
  src=Object.fromEntries(Object.entries(dirs).map(([k,d])=>[k,{sha:git(d,'rev-parse','HEAD'),dirty:!!git(d,'status','--porcelain'),path:d}]));
if(src.A.dirty||src.B.dirty)throw Error('dirty source');
writeFileSync(resolve(out,'manifest.json'),JSON.stringify({kind:'isomax-phase2-official-hard-v1',moves,blocks,timeoutMs,sequence:'ABBA',sources:src},null,2)+'\n');
const rows=[];
for(let block=0;block<blocks;block++)for(const arm of ['A','B','B','A']){
  const d=dirs[arm];
  if(git(d,'status','--porcelain')||git(d,'rev-parse','HEAD')!==src[arm].sha)throw Error('source changed');
  const child=spawnSync(process.execPath,['--experimental-ffi',resolve(d,'tools/run-isomax.mjs'),JSON.stringify({moves,timeoutMs})],{
    cwd:d,encoding:'utf8',timeout:timeoutMs+30000,maxBuffer:4*1024*1024
  });
  appendFileSync(resolve(out,'processes.jsonl'),JSON.stringify({block,arm,status:child.status,signal:child.signal,error:child.error?.message??null,stdout:child.stdout,stderr:child.stderr})+'\n');
  if(child.status!==0)throw Error(arm+' runner failed');
  const row={...JSON.parse(child.stdout.trim()),block,arm,label:labels[arm]};
  if(!['EXACT','TIMEOUT'].includes(row.status))throw Error(arm+' unexpected status '+row.status);
  if(row.requestedWorkers!==7||row.workersUsed!==7||row.config?.rootFrontier!==true)throw Error('selected profile drift');
  rows.push(row);appendFileSync(resolve(out,'samples.jsonl'),JSON.stringify(row)+'\n');
  console.log(JSON.stringify({block,arm,status:row.status,cycles:row.solveCycles,wallMs:row.wallMs,totalNodes:row.totalNodes,rootWdl:row.rootWdl,move:row.move,sharedHits:row.sharedCacheHits}));
}
const exact=rows.filter(r=>r.status==='EXACT'),results=[...new Set(exact.map(r=>JSON.stringify({rootWdl:r.rootWdl,move:r.move})))];
if(results.length>1)throw Error('exact result drift');
const summary={kind:'isomax-phase2-official-hard-summary-v1',moves,blocks,samples:rows.length,exactResult:results.length?JSON.parse(results[0]):null,arms:{}};
for(const arm of ['A','B']){
  const a=rows.filter(r=>r.arm===arm),ex=a.filter(r=>r.status==='EXACT'),to=a.filter(r=>r.status==='TIMEOUT'),
    mean=(arr,key)=>arr.length?arr.reduce((s,r)=>s+Number(r[key]??0),0)/arr.length:null;
  summary.arms[arm]={label:labels[arm],exact:ex.length,timeouts:to.length,
    meanCyclesAll:mean(a,'solveCycles'),meanWallAll:mean(a,'wallMs'),meanNodesAll:mean(a,'totalNodes'),
    meanCyclesExact:mean(ex,'solveCycles'),meanWallExact:mean(ex,'wallMs'),meanNodesExact:mean(ex,'totalNodes'),
    meanSharedHits:mean(a,'sharedCacheHits'),meanSharedStores:mean(a,'sharedCacheStores')};
}
if(summary.arms.A.exact===rows.filter(r=>r.arm==='A').length&&summary.arms.B.exact===rows.filter(r=>r.arm==='B').length){
  const ratios=[];
  for(let block=0;block<blocks;block++){
    const aa=rows.filter(r=>r.block===block&&r.arm==='A'),bb=rows.filter(r=>r.block===block&&r.arm==='B'),
      mean=x=>x.reduce((s,r)=>s+Number(r.solveCycles),0)/x.length;
    ratios.push(mean(bb)/mean(aa));
  }
  summary.exactPairedCycleRatios=ratios;
  summary.exactMeanCycleDeltaPct=(ratios.reduce((a,b)=>a+b,0)/ratios.length-1)*100;
}else{
  summary.censored=true;
  summary.interpretation='At least one arm hit the fixed 120s ceiling; do not report an exact A/B performance ratio from censored samples.';
}
writeFileSync(resolve(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
