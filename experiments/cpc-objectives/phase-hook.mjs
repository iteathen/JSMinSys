// Diagnostic only: two cold lifecycle wrappers, no recursive instrumentation.
import {performance} from 'node:perf_hooks';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {isMainThread} from 'node:worker_threads';
if(isMainThread){
const library=resolve(process.argv[2]);
const {ManagedThreadSession}=await import(pathToFileURL(resolve(library,'addons/branch-manager-host.mjs')).href);
const wait=ManagedThreadSession.prototype.wait,close=ManagedThreadSession.prototype.close;
let observed,closed;
ManagedThreadSession.prototype.wait=async function(...args){try{return await wait.apply(this,args);}finally{observed=performance.now();}};
ManagedThreadSession.prototype.close=async function(...args){try{return await close.apply(this,args);}finally{closed=performance.now();}};
process.on('beforeExit',()=>console.error(JSON.stringify({phaseDiagnostic:true,observedProcessAgeMs:observed,
  closeCompletedProcessAgeMs:closed,observationToClosedMs:closed-observed,
  note:'Observation includes host polling delay; provisional until final API error check. Not worker publication time.'})));
}
