import {spawn,execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync,appendFileSync,readFileSync,existsSync} from 'node:fs';
import {cpus,totalmem,release} from 'node:os';
import {performance} from 'node:perf_hooks';
const dir='evidence/isomax-fhourstones-20260927';
if(existsSync(dir))throw Error('Evidence destination already exists');mkdirSync(dir,{recursive:true});
const cases=[{moves:'45461667',expectedWdl:1},{moves:'35333571',expectedWdl:-1},{moves:'13333111',expectedWdl:0},{moves:'',expectedWdl:1}];
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
writeFileSync(dir+'/manifest.json',JSON.stringify({sha,node:process.version,v8:process.versions.v8,platform:process.platform,os:release(),cpu:cpus()[0].model,logicalProcessors:cpus().length,ramBytes:totalmem(),startedAt:new Date().toISOString(),inputAuthority:'https://tromp.github.io/c4/fhour.html',cases,caseTimeoutMs:120000,containmentMs:145000,repetitions:1,order:'official order; sequential; fresh process per input; no tracing',profile:JSON.parse(readFileSync('profiles/isomax-i5-12600k.json','utf8')),measurement:'QueryProcessCycleTime across all process threads; whole operation includes preparation/startup/solve/cleanup; nodes are aggregate worker visits, not unique states or reference Fhourstones node accounting.'},null,2)+'\n');
for(const [index,c] of cases.entries()){
 const started=performance.now(),label=c.moves||'empty';
 console.log('START '+label);
 const args=['--experimental-ffi','tools/run-isomax.mjs',JSON.stringify({moves:c.moves,timeoutMs:120000})];
 const child=spawn(process.execPath,args,{stdio:['ignore','pipe','pipe'],windowsHide:true});let stdout='',stderr='',contained=false;
 child.stdout.on('data',x=>stdout+=x);child.stderr.on('data',x=>stderr+=x);
 const heartbeat=setInterval(()=>console.log('RUNNING '+label+' '+Math.round((performance.now()-started)/1000)+'s'),30000);
 const watchdog=setTimeout(()=>{contained=true;child.kill();},145000);
 const end=await new Promise(resolve=>{child.once('error',e=>resolve({error:e.message}));child.once('close',(exit,signal)=>resolve({exit,signal}));});
 clearInterval(heartbeat);clearTimeout(watchdog);
 writeFileSync(dir+'/'+index+'-'+label+'.stdout.log',stdout);writeFileSync(dir+'/'+index+'-'+label+'.stderr.log',stderr);
 let result=null,parseError=null;try{result=JSON.parse(stdout.trim());}catch(e){parseError=e.message;}
 const record={index,...c,args,...end,contained,processWallMs:performance.now()-started,parseError,result};
 appendFileSync(dir+'/results.jsonl',JSON.stringify(record)+'\n');
 console.log('RESULT '+JSON.stringify({position:label,exit:end.exit,status:result?.status,rootWdl:result?.rootWdl,wallMs:result?.wallMs,nodes:result?.totalNodes,nodesPerSecond:result?.nodesPerSecond,cycles:result?.solveCycles,cyclesPerNode:result?.cyclesPerNode,cleanup:result?.cleanup}));
 if(end.exit!==0||contained||!result||!result.cleanup||result.workersExited!==7||!result.nodeCountsExact)throw Error('Invalid execution; inspect preserved evidence');
 if(result.status==='EXACT'&&result.rootWdl!==c.expectedWdl)throw Error('Incorrect WDL');
 if(!['EXACT','TIMEOUT'].includes(result.status))throw Error('Unexpected result '+result.status);
}
console.log('DONE '+sha);
