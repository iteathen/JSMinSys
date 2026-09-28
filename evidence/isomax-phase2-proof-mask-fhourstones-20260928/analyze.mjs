import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const dir='evidence/isomax-phase2-proof-mask-fhourstones-20260928';
const cases=[['45461667',1],['35333571',-1],['13333111',0],['',1]];
const rows=[];
for(const [moves,wdl] of cases){
 const raw=readFileSync(dir+'/'+(moves||'empty')+'/processes.jsonl','utf8').trim().split('\n').map(JSON.parse);
 assert.equal(raw.length,2);assert.deepEqual(raw.map(r=>r.arm),['A','B']);
 for(const p of raw){
  assert.equal(p.status,0);assert.equal(p.error,null);
  const r={...JSON.parse(p.stdout),arm:p.arm};
  assert.equal(r.fixture,moves);assert.equal(r.cleanup,true);assert.equal(r.workersExited,4);assert.deepEqual(r.errors,[]);
  assert.ok(r.nodeCounts.every(n=>n>0));assert.equal(r.nodeCountsExact,true);
  if(r.status==='EXACT'){assert.equal(r.rootWdl,wdl);assert.equal(r.errorCode,0);}
  else {assert.equal(r.status,'TIMEOUT');assert.equal(r.errorCode,102);assert.equal(r.rootWdl,null);}
  rows.push(r);
 }
}
writeFileSync(dir+'/samples.jsonl',rows.map(r=>JSON.stringify(r)).join('\n')+'\n');
const table=['| Input | Arm | Status/WDL | Wall s | CPU s | Visits | M visits/s | Cycles/visit | Process cycles (billions) |','|---|---|---|---:|---:|---:|---:|---:|---:|'];
for(const r of rows)table.push(`| ${r.fixture||'Empty'} | ${r.arm} | ${r.status}${r.status==='EXACT'?' / '+r.rootWdl:''} | ${(r.wallMs/1000).toFixed(3)} | ${(r.cpuMs/1000).toFixed(3)} | ${r.totalNodes} | ${(r.nodesPerSecond/1e6).toFixed(3)} | ${r.cyclesPerNode.toFixed(1)} | ${(Number(r.solveCycles)/1e9).toFixed(3)} |`);
writeFileSync(dir+'/table.md',table.join('\n')+'\n');
const summary={samples:rows.length,arms:Object.fromEntries(['A','B'].map(a=>{const rs=rows.filter(r=>r.arm===a);return [a,{sha:rs[0].sourceSha,exact:rs.filter(r=>r.status==='EXACT').length,timeouts:rs.filter(r=>r.status==='TIMEOUT').length,totalCycles:rs.reduce((s,r)=>s+Number(r.solveCycles),0),totalNodes:rs.reduce((s,r)=>s+r.totalNodes,0),wallMs:rs.reduce((s,r)=>s+r.wallMs,0)}]})),allWorkersActive:rows.every(r=>r.nodeCounts.every(n=>n>0)),allCleanup:rows.every(r=>r.cleanup&&r.workersExited===4),exactComparisons:[]};
for(let i=0;i<rows.length;i+=2){const a=rows[i],b=rows[i+1];if(a.status==='EXACT'&&b.status==='EXACT'){assert.equal(a.move,b.move);summary.exactComparisons.push({moves:a.fixture,wdl:a.rootWdl,move:a.move,cycleDeltaPct:(Number(b.solveCycles)/Number(a.solveCycles)-1)*100,wallDeltaPct:(b.wallMs/a.wallMs-1)*100,interval95:null});}}
writeFileSync(dir+'/summary.json',JSON.stringify(summary,null,2)+'\n');
const hashes={algorithm:'sha256',encoding:'LF-normalized UTF-8 file bytes',files:{}};
for(const entry of readdirSync(dir,{recursive:true}).sort()){if(entry==='hashes.json')continue;try{const b=readFileSync(dir+'/'+entry);hashes.files[entry]=createHash('sha256').update(b.toString('utf8').replace(/\r\n/g,'\n')).digest('hex');}catch(e){if(e.code!=='EISDIR'&&e.code!=='EPERM')throw e;}}
writeFileSync(dir+'/hashes.json',JSON.stringify(hashes,null,2)+'\n');
console.log(JSON.stringify(summary));console.log(table.join('\n'));
