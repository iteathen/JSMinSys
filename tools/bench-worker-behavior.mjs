// Component-only cycle probe; no solver changes or NEES promotion from this run.
import {writeFileSync} from 'node:fs';
import {cpus} from 'node:os';
import {performance} from 'node:perf_hooks';
import {execFileSync} from 'node:child_process';
import {BehaviorWorker,createWorkerBehavior32,publishWorkerBehavior32} from '../addons/worker-behavior.mjs';
import {readWorkerBehavior32} from '../src/worker-behavior32.mjs';

const iterations=Number(process.argv[2]??5000000),output=process.argv[3];
if(!Number.isSafeInteger(iterations)||iterations<1||iterations>100000000)throw Error('invalid iteration count');
if(process.platform!=='win32')throw Error('This cycle probe requires Windows QueryProcessCycleTime');
const {DynamicLibrary}=await import('node:ffi');
const dll=new DynamicLibrary('kernel32.dll'),
  current=dll.getFunction('GetCurrentProcess',{arguments:[],return:'pointer'}),
  query=dll.getFunction('QueryProcessCycleTime',{arguments:['pointer','buffer'],return:'int32'}),
  handle=current(),buffer=Buffer.alloc(8);
function cycles(){if(!query(handle,buffer))throw Error('QueryProcessCycleTime failed');return buffer.readBigUInt64LE();}
const bootstrap=cycles(),words=createWorkerBehavior32(1),worker=new BehaviorWorker(0,words,0);
function plain(n){let sum=0;for(let i=0;i<n;i++)sum=(sum+(i&255))|0;return sum;}
function direct(n){let sum=0;for(let i=0;i<n;i++)sum=(sum+(i&255)+readWorkerBehavior32(words,0,worker.behaviorExtensions,0))|0;return sum;}
function method(n){let sum=0;for(let i=0;i<n;i++)sum=(sum+(i&255)+worker.readBehavior32())|0;return sum;}
// Warm all paths, then return to the common primary-zero case before pairing.
plain(100000);direct(100000);method(100000);
publishWorkerBehavior32(words,0,1,2,3,4);direct(100000);method(100000);
publishWorkerBehavior32(words,0,0);
const warm=cycles(),rows=[];
function measure(label,fn,block=-1){
  const before=cycles(),start=performance.now(),checksum=fn(iterations),after=cycles();
  rows.push({label,block,iterations,checksum,cycles:(after-before).toString(),
    cyclesPerCheckpoint:Number(after-before)/iterations,wallMs:performance.now()-start});
}
for(let block=0;block<4;block++)for(const arm of ['plain','direct','direct','plain'])
  measure(arm,arm==='plain'?plain:direct,block);
measure('method-primary',method);
publishWorkerBehavior32(words,0,1,2);measure('direct-two-words',direct);
publishWorkerBehavior32(words,0,1,2,3,4);measure('direct-four-words',direct);
const final=cycles(),measured=rows.reduce((n,r)=>n+BigInt(r.cycles),0n);
dll.close();
const group=label=>rows.filter(r=>r.label===label),mean=rows=>rows.reduce((n,r)=>n+r.cyclesPerCheckpoint,0)/rows.length;
const report={kind:'worker-behavior-component-cycle-probe',node:process.version,v8:process.versions.v8,
  cpu:cpus()[0].model,sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  iterations,bootstrapCycles:bootstrap.toString(),setupAndWarmupCycles:(warm-bootstrap).toString(),
  measuredCycles:measured.toString(),betweenSamplesCycles:(final-warm-measured).toString(),totalProcessCycles:final.toString(),
  meanCheckpointCycles:{plain:mean(group('plain')),direct:mean(group('direct'))},
  meanAddedCheckpointCycles:mean(group('direct'))-mean(group('plain')),rows,
  scope:'Uncontended component loop. Costs include loop/consumer operations. Not solver overhead, not a concurrent-write cost bound, not full NEES qualification.'};
const json=JSON.stringify(report,null,2)+'\n';if(output)writeFileSync(output,json);else process.stdout.write(json);
