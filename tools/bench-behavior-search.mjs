// Actual-solve accounting; reports total process cycles through final checkpoint.
// No test-only per-node counters in measured execution. Windows cycle API only.
import {writeFileSync} from 'node:fs';
import {cpus} from 'node:os';
import {execFileSync} from 'node:child_process';
import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';
import {prepareConnect4RbaGeometry} from '../addons/rba-connect4-geometry.mjs';
import {connect4RbaFromMoves} from '../addons/rba-connect4-ingress.mjs';
import {prepareConnect4RbaAlphaBeta,solveConnect4RbaAlphaBeta} from '../addons/rba-connect4-alphabeta.mjs';
import {prepareConnect4RbaAlphaBetaBehavior,solveConnect4RbaAlphaBetaBehavior} from '../addons/rba-connect4-alphabeta-behavior.mjs';
import {createWorkerBehaviorMemory32,BehaviorWorker} from '../addons/worker-behavior.mjs';

const {DynamicLibrary}=await import('node:ffi');
const dll=new DynamicLibrary('kernel32.dll'),current=dll.getFunction('GetCurrentProcess',{arguments:[],return:'pointer'}),
 query=dll.getFunction('QueryProcessCycleTime',{arguments:['pointer','buffer'],return:'int32'}),handle=current(),buffer=Buffer.alloc(8);
function cycles(){if(!query(handle,buffer))throw Error('cycle query failed');return buffer.readBigUInt64LE();}
const start=cycles(),fixtures=[
 {columns:4,rows:4,moves:[],repeats:200},
 {columns:7,rows:6,moves:[4,0,0,0,3,3,0,0,6,2,3,0,2,3,6,3,6,3,4,6,2,2,6,1,2,5,6,4],repeats:200},
],prepared=[];
// One prepared reader per evaluator, as in the production optional worker.
// Replacing Wasm call targets between fixtures creates a different JIT profile.
const beforeBehavior=cycles(),memory=createWorkerBehaviorMemory32(1);
const behavior=new BehaviorWorker(0,new Uint32Array(memory.buffer),0,memory);
const behaviorPreparationCycles=cycles()-beforeBehavior;
for(const f of fixtures){
 const g=prepareConnect4RbaGeometry(f),root=connect4RbaFromMoves(f.moves,{geometry:g});
 const plain=prepareConnect4RbaAlphaBeta({geometry:g,cacheCapacity:4096});
 const controlled=prepareConnect4RbaAlphaBetaBehavior({geometry:g,cacheCapacity:4096,behavior});
 const expected=solveConnect4RbaAlphaBeta(root,{state:plain,reflected:root.reflected});
 const actual=solveConnect4RbaAlphaBetaBehavior(root,{state:controlled,reflected:root.reflected});
 assert.equal(actual.value,expected.value);assert.equal(actual.move,expected.move);assert.deepEqual(actual.metrics,expected.metrics);
 for(let i=0;i<100;i++){
  solveConnect4RbaAlphaBeta(root,{state:plain,reflected:root.reflected});
  solveConnect4RbaAlphaBetaBehavior(root,{state:controlled,reflected:root.reflected});
 }
 prepared.push({f,root,plain,controlled,expected});
}
const warm=cycles(),rows=[];
for(let block=0;block<4;block++)for(const p of prepared)for(const arm of ['plain','behavior','behavior','plain']){
 const solve=arm==='plain'?solveConnect4RbaAlphaBeta:solveConnect4RbaAlphaBetaBehavior;
 const state=arm==='plain'?p.plain:p.controlled;
 const options={state,reflected:p.root.reflected};
 let checksum=0,nodes=0,completedNodes=0;
 const c=cycles(),t=performance.now();
 for(let i=0;i<p.f.repeats;i++){
  const result=solve(p.root,options);
  checksum+=result.value+result.move;nodes+=result.metrics.nodes;completedNodes+=result.metrics.cofactors+1;
 }
 const elapsed=cycles()-c,wallMs=performance.now()-t;
 assert.equal(checksum,p.f.repeats*(p.expected.value+p.expected.move));
 rows.push({geometry:`${p.f.columns}x${p.f.rows}`,arm,block,solves:p.f.repeats,nodes,completedNodes,
  cycles:elapsed.toString(),cyclesPerVisitedNode:Number(elapsed)/nodes,cyclesPerCompletedNode:Number(elapsed)/completedNodes,wallMs});
}
const final=cycles(),measured=rows.reduce((n,r)=>n+BigInt(r.cycles),0n);
dll.close();
const report={kind:'actual-search-per-node-behavior-abba',sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
 dirty:execFileSync('git',['status','--porcelain'],{encoding:'utf8'}).trim(),node:process.version,v8:process.versions.v8,cpu:cpus()[0].model,
 startupCycles:start.toString(),setupAndWarmupCycles:(warm-start).toString(),measuredCycles:measured.toString(),
 betweenSamplesCycles:(final-warm-measured).toString(),totalThroughFinalCheckpoint:final.toString(),
 behaviorPreparationCycles:behaviorPreparationCycles.toString(),behaviorBytes:memory.buffer.byteLength,
 fixtures:prepared.map(p=>({...p.f,expected:p.expected})),rows,
 scope:'Actual single-evaluator solves with a primary read/STOP decision at every completed node. No concurrent writer. Whole-process meter includes background runtime work. Excludes report construction/shutdown. Not a full NEES or SMP scaling qualification.'};
writeFileSync(process.argv[2]??'behavior-search-cycles.json',JSON.stringify(report,null,2)+'\n');
