import {mkdirSync,writeFileSync,appendFileSync,readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const base=resolve(process.argv[2]),candidate=resolve(process.argv[3]),out=resolve(process.argv[4]);
mkdirSync(out,{recursive:true});
const cases=JSON.parse(readFileSync(candidate+'/evidence/isomax-native-frontier-cleanup-20260927/manifest.json','utf8')).cases.map(c=>({...c,id:c.id==='begin-hard-derived'?'fhourstones-derived':c.id}));
const manifest={baseline:'a667bd1bad1c2cc4273a1ddd94f58592f558b18e',candidate:'working tree; exact patch retained',node:process.version,v8:process.versions.v8,repeats:5,cases,timeoutMs:30000,workers:7,policy:'six deep / one wide',sharedEntries:4194304,privateEntries:1048576,order:'alternating paired fresh processes; sequential; stop on invalid outcome'};
assert.ok(!requireExists(out+'/samples.jsonl'),'refuse to overwrite evidence');
function requireExists(p){try{readFileSync(p);return true;}catch(e){if(e.code==='ENOENT')return false;throw e;}}
writeFileSync(out+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');
for(let round=0;round<5;round++)for(const c of cases){
  for(const arm of round%2?['after','before']:['before','after']){
    const cwd=arm==='before'?base:candidate;
    const run=spawnSync(process.execPath,['--experimental-ffi','tools/run-isomax.mjs',JSON.stringify({moves:c.moves,timeoutMs:30000})],{cwd,encoding:'utf8',timeout:45000,maxBuffer:8*1024*1024,windowsHide:true});
    appendFileSync(out+'/processes.jsonl',JSON.stringify({round,case:c.id,arm,exit:run.status,signal:run.signal,error:run.error?.message,stderr:run.stderr})+'\n');
    assert.equal(run.status,0,run.stderr);const r=JSON.parse(run.stdout.trim());
    appendFileSync(out+'/samples.jsonl',JSON.stringify({round,case:c.id,arm,...r})+'\n');
    assert.equal(r.status,'EXACT');assert.equal(r.rootWdl,c.wdl);assert.equal(r.cleanup,true);assert.equal(r.workersExited,7);assert.equal(r.nodeCountsExact,true);
    console.log(JSON.stringify({round,case:c.id,arm,ms:r.wallMs,cycles:r.solveCycles,nodes:r.totalNodes}));
  }
}
const rows=readFileSync(out+'/samples.jsonl','utf8').trim().split('\n').map(JSON.parse);
const median=a=>a.sort((a,b)=>a-b)[a.length>>1];
const summary=cases.map(c=>{const r=rows.filter(r=>r.case===c.id),b=r.filter(r=>r.arm==='before'),a=r.filter(r=>r.arm==='after');const m=arr=>Object.fromEntries(['wallMs','solveCycles','totalCycles','totalNodes','cyclesPerNode'].map(k=>[k,median(arr.map(r=>Number(r[k])))]));const before=m(b),after=m(a);return {case:c.id,before,after,delta:Object.fromEntries(Object.keys(before).map(k=>[k,100*(after[k]/before[k]-1)])),pairedCycleMedianPercent:median(a.map(x=>100*(Number(x.solveCycles)/Number(b.find(y=>y.round===x.round).solveCycles)-1)))};});
writeFileSync(out+'/summary.json',JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2));
