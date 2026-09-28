import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,readdirSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
const dir='evidence/isomax-phase2-nightly-empty-20260928';
const fields=['solveCycles','wallMs','cpuMs','totalNodes','winnerNodes','cyclesPerNode','nodesPerSecond','sharedCacheHits','sharedCacheStores','sharedCacheStoreContention','processPeakRssBytes'];
for(const mode of ['runtime','empty']){
 const raw=readFileSync(dir+'/'+mode+'-processes.jsonl','utf8').trim().split('\n').map(JSON.parse),rows=raw.map(p=>({...JSON.parse(p.stdout),index:p.index,arm:p.arm,nodeVersion:p.version}));
 assert.equal(rows.length,mode==='runtime'?8:2);
 for(const [i,r] of rows.entries()){
  assert.equal(raw[i].status,0);assert.equal(raw[i].error,null);assert.equal(r.index,i);assert.equal(r.arm,(mode==='runtime'?'ABBAABBA':'AB')[i]);
  assert.equal(r.sourceSha,mode==='runtime'||r.arm==='A'?'be7c2887defcefb37080fa61de7ce1dc38dc2990':'7f74e324457c4237590bc6b0f924852f6d728e4c');
  assert.equal(r.nodeVersion,mode==='runtime'&&r.arm==='A'?'v26.7.0':'v27.0.0-nightly20260928b59840b593');
  assert.equal(r.fixture,mode==='runtime'?'353335714':'');assert.equal(r.cleanup,true);assert.equal(r.workersExited,4);assert.deepEqual(r.errors,[]);assert.ok(r.nodeCounts.every(n=>Number.isSafeInteger(n)&&n>0));
  if(r.status==='EXACT'){assert.equal(r.errorCode,0);assert.equal(r.rootWdl,mode==='runtime'?-1:1);}else{assert.equal(r.status,'TIMEOUT');assert.equal(r.errorCode,102);assert.equal(r.rootWdl,null);}
 }
 const exact=rows.filter(r=>r.status==='EXACT');assert.ok(new Set(exact.map(r=>r.move)).size<=1);
 const summary={mode,samples:rows.length,allExact:exact.length===rows.length,arms:{},paired:{}};
 for(const arm of ['A','B']){const rs=rows.filter(r=>r.arm===arm);summary.arms[arm]={sha:rs[0].sourceSha,node:rs[0].nodeVersion,exact:rs.filter(r=>r.status==='EXACT').length,timeouts:rs.filter(r=>r.status==='TIMEOUT').length,mean:Object.fromEntries(fields.map(f=>[f,rs.every(r=>r[f]!==null)?rs.reduce((s,r)=>s+Number(r[f]),0)/rs.length:null])),perWorkerMean:[0,1,2,3].map(i=>rs.reduce((s,r)=>s+r.nodeCounts[i],0)/rs.length)};}
 if(mode==='runtime'&&summary.allExact){for(const f of fields){const ratios=[];for(let i=0;i<8;i+=2){const p=rows.slice(i,i+2);ratios.push(Number(p.find(r=>r.arm==='B')[f])/Number(p.find(r=>r.arm==='A')[f]));}const m=ratios.reduce((s,r)=>s+r,0)/4,se=Math.sqrt(ratios.reduce((s,r)=>s+(r-m)**2,0)/12);summary.paired[f]={ratios,deltaPct:(m-1)*100,interval95Pct:[(m-3.182446305*se-1)*100,(m+3.182446305*se-1)*100]};}}
 writeFileSync(dir+'/'+mode+'-summary.json',JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary));
}
const hashes={algorithm:'SHA256',encoding:'LF-normalized UTF-8',files:{}};
for(const name of readdirSync(dir,{recursive:true}).map(p=>p.replaceAll('\\','/')).sort()){if(name==='hashes.json'||!statSync(dir+'/'+name).isFile())continue;hashes.files[name]=createHash('sha256').update(readFileSync(dir+'/'+name,'utf8').replace(/\r\n/g,'\n')).digest('hex');}
writeFileSync(dir+'/hashes.json',JSON.stringify(hashes,null,2)+'\n');
