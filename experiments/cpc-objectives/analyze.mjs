import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {compareArms} from './stats.mjs';
import {validateCycleSample} from '../cpc-factorial/isomax-cycle-analysis.mjs';
const out=resolve(process.argv[2]),read=p=>readFileSync(p,'utf8').trim().split('\n').map(JSON.parse),
  parallel=read(resolve(out,'parallel.jsonl')),serial=read(resolve(out,'serial.jsonl')),
  old=read(resolve(out,'../cpc-factorial-20260926/screen-verified/samples.jsonl')),
  phase=read(resolve(out,'phase.jsonl')),processes=read(resolve(out,'processes.jsonl')),
  manifest=JSON.parse(readFileSync(resolve(out,'manifest.json')));
assert.equal(processes.length,72);assert.ok(processes.every(p=>p.exit===0));assert.equal(phase.length,8);
for(const s of [...parallel,...phase])validateCycleSample(s,manifest.sources[s.arm.charCodeAt(0)-65].sha,'production');
for(const s of serial){
  assert.ok(s.oracleMatched&&!s.libraryDirty);assert.equal(s.librarySha,manifest.sources[s.arm.charCodeAt(0)-65].sha);
  assert.equal(BigInt(s.bootstrapCycles)+BigInt(s.setupCycles)+BigInt(s.solveCycles),BigInt(s.totalProcessCycles));
}
const mean=a=>a.reduce((a,b)=>a+b,0)/a.length;
const means=(rows,fields)=>Object.fromEntries([...'ABCD'].map(arm=>[arm,Object.fromEntries(fields.map(f=>[f,mean(rows.filter(r=>r.arm===arm).map(r=>Number(r[f])))]))]));
const phaseRows=processes.filter(p=>p.mode==='phase').map(p=>{
  const d=p.stderr.split('\n').find(l=>l.startsWith('{"phaseDiagnostic":true'));
  assert.ok(d);const x=JSON.parse(d);assert.ok(x.observationToClosedMs>=0);return {...x,arm:p.arm};
});
const summary={oldParallelLatency:compareArms(old,'wallMs'),parallelLatency:compareArms(parallel,'wallMs'),
  serialSolveCycles:compareArms(serial,'solveCycles'),serialLatency:compareArms(serial,'wallMs'),
  parallelAggregateCycles:compareArms(parallel,'totalProcessCycles'),
  parallelMeans:means(parallel,['wallMs','setupMs','solveCycles','totalProcessCycles']),
  serialMeans:means(serial,['wallMs','setupMs','solveCycles','totalProcessCycles','nodes','cyclesPerNode']),
  phaseMeans:means(phaseRows,['observationToClosedMs','observedProcessAgeMs']),
  scope:'Eight-block descriptive unadjusted 95% intervals; one fixture. Serial process cycles include runtime helper threads. No production promotion.'};
writeFileSync(resolve(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2));
const compareDToC=(rows,metric)=>compareArms(rows.map(r=>({...r,arm:r.arm==='C'?'A':r.arm==='A'?'C':r.arm})),metric).D;
writeFileSync(resolve(out,'direct-comparison.json'),JSON.stringify({serialD_vs_C:compareDToC(serial,'solveCycles'),
  parallelD_vs_C:compareDToC(parallel,'wallMs')},null,2)+'\n');
