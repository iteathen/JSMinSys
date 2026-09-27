// Offline evidence analysis only. Never imported by a solver or worker.
import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {labelRanks} from './move-confidence.mjs';
const base=new URL('../../evidence/',import.meta.url);
const broad='isomax-move-confidence-corrected-20260927',focused='isomax-move-confidence-focused-20260927';
const read=(dir,file)=>readFileSync(new URL(`${dir}/${file}`,base),'utf8').trim().split('\n').map(JSON.parse);
const b=read(broad,'labels.jsonl'),f=read(focused,'labels.jsonl'),samples=read(broad,'samples.jsonl');
assert.equal(b.length,82);assert.equal(f.length,48);assert.equal(samples.length,92);
for(const r of [...b,...f]){
  assert.equal(r.status,'COMPLETE');assert.equal(r.cleanup,true);
  assert.deepEqual(labelRanks(r.features,r.values),r.ranks);
  assert.ok(r.ranks.best===r.rootRelative);
}
assert.ok(f.every(r=>r.features.choices>1&&r.features.cpcInterval[0]!==r.features.cpcInterval[1]));
for(const group of ['tied','near','clear'])for(const parity of [0,1])
  assert.equal(f.filter(r=>r.features.group===group&&r.features.ply%2===parity).length,8);
function stats(rows){
  return {n:rows.length,firstOptimal:rows.filter(r=>r.ranks.firstCorrect).length,
    rawFirstOptimal:rows.filter(r=>r.ranks.rawFirstCorrect).length,
    uniformEligibleChance:rows.length?rows.reduce((s,r)=>s+r.ranks.optimalCount/r.features.choices,0)/rows.length:null,
    meanFirstOptimalRank:rows.length?rows.reduce((s,r)=>s+r.ranks.firstOptimalRank,0)/rows.length:null};
}
const cohorts={broad:b.filter(r=>r.split!=='diagnostic'),focused:f},accuracy={};
for(const [name,rows] of Object.entries(cohorts)){
  accuracy[name]={all:stats(rows),subsets:{}};
  for(const [subset,predicate] of Object.entries({multi:r=>r.features.choices>1,
    discriminating:r=>r.features.choices>1&&!r.ranks.allEquivalent,
    unresolved:r=>r.features.choices>1&&r.features.cpcInterval[0]!==r.features.cpcInterval[1],
    unresolvedDiscriminating:r=>r.features.choices>1&&!r.ranks.allEquivalent&&r.features.cpcInterval[0]!==r.features.cpcInterval[1]})){
    const selected=rows.filter(predicate),groups={};
    for(const group of ['tied','near','clear']){
      const a=selected.filter(r=>r.features.group===group);
      groups[group]={...stats(a),discovery:stats(a.filter(r=>r.split==='discovery')),
        holdout:stats(a.filter(r=>r.split==='holdout')),
        p0:stats(a.filter(r=>r.features.ply%2===0)),p1:stats(a.filter(r=>r.features.ply%2===1))};
    }
    accuracy[name].subsets[subset]={...stats(selected),groups};
  }
}
const median=a=>{const s=[...a].sort((x,y)=>x-y);return s.length%2?s[s.length>>1]:(s[s.length/2-1]+s[s.length/2])/2;};
const performance=[];
for(const workers of [1,7])for(const id of [...new Set(samples.map(s=>s.id))]){
  const arms={};
  for(const arm of ['probe-deep','probe']){
    const rows=samples.filter(s=>s.id===id&&s.config.workers===workers&&s.arm===arm);
    for(const s of rows){
      assert.equal(s.cleanup,true);assert.deepEqual(s.errors,[]);assert.equal(s.workersExited,workers);
      if(s.status==='EXACT')assert.equal(s.rootWdl,b.find(r=>r.id===id).value-2);
      else{assert.equal(s.status,'TIMEOUT');assert.equal(s.rootWdl,null);}
    }
    const complete=rows.every(s=>s.status==='EXACT');
    assert.equal(rows.length,complete?3:1);
    arms[arm]={n:rows.length,status:complete?'EXACT':'TIMEOUT',
      wallMs:median(rows.map(s=>s.wallMs)),operationCycles:median(rows.map(s=>Number(s.solveCycles))),
      processCycles:median(rows.map(s=>Number(s.totalCycles))),nodes:median(rows.map(s=>s.totalNodes))};
  }
  const exact=arms.probe.status==='EXACT',delta={};
  for(const field of ['wallMs','operationCycles','processCycles','nodes'])delta[field]=exact?100*(arms.probe[field]/arms['probe-deep'][field]-1):null;
  performance.push({workers,id,group:b.find(r=>r.id===id).features.group,arms,probeDeltaPercent:delta});
}
assert.equal(samples.filter(s=>s.status==='TIMEOUT').length,2);
const summary={accuracy,performance,trialCounts:{scored:92,exact:90,timeout:2,skipped:4,interruptedUnscored:1}};
writeFileSync(new URL(`${focused}/summary.json`,base),JSON.stringify(summary,null,2)+'\n');
const lines=['# Generated performance medians','','Reproduce with `node experiments/strategist/move-confidence-report.mjs`. Negative delta favors probing. TIMEOUT rows are censored, not completed-solve scores. Process cycles include startup; operation cycles cover the host solve invocation including workers and cleanup. All cycles sum all process threads.','','| Workers | Case | Gap | Deep / probe ms | Operation cycles delta | Process cycles delta | Deep / probe nodes |','|---|---|---|---:|---:|---:|---:|'];
for(const p of performance){
  const d=p.arms['probe-deep'],w=p.arms.probe,ok=w.status==='EXACT';
  const percent=v=>v.toFixed(1)+'%';
  lines.push(`| ${p.workers} | ${p.id} | ${p.group} | ${d.wallMs.toFixed(2)} / ${ok?w.wallMs.toFixed(2):'TIMEOUT 30s'} | ${ok?percent(p.probeDeltaPercent.operationCycles):'censored'} | ${ok?percent(p.probeDeltaPercent.processCycles):'censored'} | ${d.nodes} / ${w.nodes}${ok?'':' (partial)'} |`);
}
writeFileSync(new URL(`${focused}/PERFORMANCE.md`,base),lines.join('\n')+'\n');
console.log(JSON.stringify(summary.trialCounts));
