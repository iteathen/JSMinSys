import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
import {cpus,totalmem,release} from 'node:os';
const dir='evidence/isomax-phase2-proof-mask-fhourstones-20260928';
const cases=[['45461667',1],['35333571',-1],['13333111',0],['',1]];
writeFileSync(dir+'/environment.json',JSON.stringify({startedAt:new Date().toISOString(),node:process.version,v8:process.versions.v8,os:release(),platform:process.platform,cpu:cpus()[0].model,logicalProcessors:cpus().length,ramBytes:totalmem(),counter:'Windows QueryProcessCycleTime',cases,caseTimeoutMs:120000,repetitions:1,order:'official inputs; AB per input; fresh processes',hardware:'10 physical cores,16 logical; i5-12600K'},null,2)+'\n');
for(const [moves,expected] of cases){
 const out=dir+'/'+(moves||'empty');
 console.log('START '+(moves||'empty'));
 const r=spawnSync(process.execPath,['experiments/isomax-phase2/cpc-proof-mask-source-ab.mjs',out,'C:/r/isomax-p2-proof-mask-A','C:/r/isomax-p2-proof-mask-B',moves,'1','120000'],{encoding:'utf8',windowsHide:true,maxBuffer:8*1024*1024});
 writeFileSync(out+'.stdout.log',r.stdout??'');writeFileSync(out+'.stderr.log',r.stderr??'');
 if(r.status!==0)throw Error('case process failed: '+(r.error?.message??r.status));
 const rows=readFileSync(out+'/samples.jsonl','utf8').trim().split('\n').map(JSON.parse);
 for(const row of rows){
  if(!['EXACT','TIMEOUT'].includes(row.status))throw Error('unexpected status');
  if(row.status==='EXACT'&&row.rootWdl!==expected)throw Error('oracle mismatch');
  console.log(JSON.stringify({moves,arm:row.arm,status:row.status,rootWdl:row.rootWdl,wallMs:row.wallMs,nodes:row.totalNodes,cycles:row.solveCycles}));
 }
}
