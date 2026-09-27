// Cold single-evaluator measurement. No worker emulation or hot-path changes.
import {performance} from 'node:perf_hooks';
import {cpus} from 'node:os';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {processCycleCounter} from '../cpc-factorial/cycle-counter.mjs';
const library=resolve(process.argv[2]),meter=await processCycleCounter(),bootstrap=meter.read(),setupStart=performance.now();
try{
  const {prepareConnect4RbaGeometry,connect4RbaFromMoves,prepareConnect4RbaAlphaBeta,solveConnect4RbaAlphaBeta,RBA_AB_CPC_ONLY}=
    await import(pathToFileURL(resolve(library,'addons/index.mjs')).href);
  const geometry=prepareConnect4RbaGeometry({columns:7,rows:6}),
    root=connect4RbaFromMoves([3,4,3,5,0,5,5,6],{geometry,positionCode:false}),
    state=prepareConnect4RbaAlphaBeta({geometry,mode:RBA_AB_CPC_ONLY,cacheCapacity:65536,orderOffset:0,
      cpcFrontierResponse:false,cpcProjectedAdvisory:false}),
    setupMs=performance.now()-setupStart,before=meter.read(),start=performance.now(),
    result=solveConnect4RbaAlphaBeta(root,{state,reflected:root.reflected?1:0}),
    wallMs=performance.now()-start,after=meter.read();
  const git=(...args)=>execFileSync('git',['-C',library,...args],{encoding:'utf8'}).trim();
  console.log(JSON.stringify({input:'45461667',mode:'serial',evaluators:1,localCacheCapacity:65536,sharedCacheCapacity:0,
    librarySha:git('rev-parse','HEAD'),libraryDirty:!!git('status','--porcelain'),
    node:process.version,v8:process.versions.v8,cpu:cpus()[0].model,
    bootstrapCycles:String(bootstrap),setupCycles:String(before-bootstrap),solveCycles:String(after-before),totalProcessCycles:String(after),
    setupMs,wallMs,processAgeAtResultMs:performance.timeOrigin?start+wallMs:null,
    rootWdl:result.value-2,move:result.move,oracleMatched:result.value===3&&result.move===3,
    nodes:result.metrics.nodes,metrics:result.metrics,cyclesPerNode:Number(after-before)/result.metrics.nodes,
    boundary:'Serial solve-call process cycle delta; includes runtime helper threads. No search workers launched.'}));
}catch(error){console.log(JSON.stringify({error:error.stack}));process.exitCode=1;}
finally{meter.close();}
