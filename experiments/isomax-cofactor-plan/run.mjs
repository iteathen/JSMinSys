// Same-runner ABBA Stage-2 controller. A = direct recompute D, B = support-plan candidate.
import {appendFileSync,existsSync,mkdirSync,writeFileSync} from 'node:fs';
import {cpus,platform,release} from 'node:os';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync,spawnSync} from 'node:child_process';
const [outArg,aArg,bArg,moves='353335714',blocksArg='8']=process.argv.slice(2);
if(!outArg||!aArg||!bArg)throw Error('usage: node run.mjs OUTPUT BASELINE CANDIDATE MOVES BLOCKS');
const blocks=Number(blocksArg);if(!Number.isInteger(blocks)||blocks<2||blocks>16)throw RangeError('blocks');
const out=resolve(outArg);if(existsSync(out))throw Error('output exists');mkdirSync(out,{recursive:true});
const dirs={A:resolve(aArg),B:resolve(bArg)},git=(dir,...args)=>execFileSync('git',['-C',dir,...args],{encoding:'utf8'}).trim();
const source=Object.fromEntries(Object.entries(dirs).map(([k,d])=>[k,{path:d,sha:git(d,'rev-parse','HEAD'),dirty:!!git(d,'status','--porcelain')}]));
if(source.A.dirty||source.B.dirty)throw Error('dirty source');
const sample=resolve(dirname(fileURLToPath(import.meta.url)),'sample.mjs');
writeFileSync(resolve(out,'manifest.json'),JSON.stringify({kind:'isomax-cofactor-plan-screen-manifest-v1',moves,blocks,sequence:'ABBA',
  source,runner:{cpu:cpus()[0]?.model??null,platform:platform(),release:release(),node:process.version,v8:process.versions.v8},
  primary:'solveCycles',memory:'planBytes/RSS reported separately; plan arena allocation excluded from solve-cycle boundary'},null,2)+'\n');
const rows=[];
for(let block=0;block<blocks;block++)for(const arm of ['A','B','B','A']){
  const d=dirs[arm],cur={sha:git(d,'rev-parse','HEAD'),dirty:!!git(d,'status','--porcelain')};
  if(cur.dirty||cur.sha!==source[arm].sha)throw Error('source changed');
  const child=spawnSync(process.execPath,['--experimental-ffi',sample,d,moves],{encoding:'utf8',timeout:moves==='353335714'?90000:30000,maxBuffer:1024*1024});
  appendFileSync(resolve(out,'processes.jsonl'),JSON.stringify({block,arm,exitCode:child.status,signal:child.signal,error:child.error?.message??null,stdout:child.stdout,stderr:child.stderr})+'\n');
  if(child.status!==0)throw Error('sample failed');
  const row={...JSON.parse(child.stdout.trim()),block,arm};if(row.sourceSha!==source[arm].sha)throw Error('source mismatch');
  appendFileSync(resolve(out,'samples.jsonl'),JSON.stringify(row)+'\n');rows.push(row);
  console.log(JSON.stringify({block,arm,cycles:row.solveCycles,wallMs:row.wallMs,nodes:row.metrics.nodes,planCount:row.planCount}));
}
const sig=r=>JSON.stringify({result:r.result,metrics:r.metrics});
const sa=[...new Set(rows.filter(r=>r.arm==='A').map(sig))],sb=[...new Set(rows.filter(r=>r.arm==='B').map(sig))];
if(sa.length!==1||sb.length!==1||sa[0]!==sb[0])throw Error('search signature changed');
const t95=[null,null,12.706,4.303,3.182,2.776,2.571,2.447,2.365,2.306,2.262,2.228,2.201,2.179,2.160,2.145,2.131];
const stats={};
for(const field of ['solveCycles','cyclesPerNode','wallMs','cpuMs']){
  const ratios=[];
  for(let block=0;block<blocks;block++){const a=rows.filter(r=>r.block===block&&r.arm==='A'),b=rows.filter(r=>r.block===block&&r.arm==='B');
    const mean=x=>x.reduce((s,r)=>s+Number(r[field]),0)/x.length;ratios.push(mean(b)/mean(a));}
  const mean=ratios.reduce((a,b)=>a+b,0)/ratios.length,v=ratios.reduce((s,x)=>s+(x-mean)**2,0)/(ratios.length-1),se=Math.sqrt(v/ratios.length),t=t95[blocks];
  stats[field]={blockRatios:ratios,meanDeltaPct:(mean-1)*100,interval95Pct:[(mean-t*se-1)*100,(mean+t*se-1)*100]};
}
const mean=(arm,key)=>{const r=rows.filter(x=>x.arm===arm);return r.reduce((s,x)=>s+Number(x[key]),0)/r.length;};
const summary={kind:'isomax-cofactor-plan-screen-summary-v1',moves,blocks,samples:rows.length,stats,
  means:{A:{solveCycles:mean('A','solveCycles'),cyclesPerNode:mean('A','cyclesPerNode'),wallMs:mean('A','wallMs'),rssAfter:mean('A','rssAfter')},
    B:{solveCycles:mean('B','solveCycles'),cyclesPerNode:mean('B','cyclesPerNode'),wallMs:mean('B','wallMs'),rssAfter:mean('B','rssAfter'),
      planCount:mean('B','planCount'),planBytes:mean('B','planBytes')}},
  deterministic:JSON.parse(sa[0]),interpretation:'Equal-work Stage-2 screen. Plan allocation is cold but memory remains reported. Promotion requires independent confirmation and multiworker redesign/qualification.'};
writeFileSync(resolve(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
