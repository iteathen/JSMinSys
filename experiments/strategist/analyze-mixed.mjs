// Cold descriptive analysis. Timeouts are never silently converted to solves.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
const out=resolve(process.argv[2]),rows=readFileSync(resolve(out,'samples.jsonl'),'utf8').trim().split('\n').map(JSON.parse),
  labels=['modes-deep','modes-wide-helper','modes-wide-anchor'];
assert.equal(rows.length,54);
assert.ok(rows.every(r=>r.cleanup&&!r.forcedTerminations&&!r.errors.length&&['EXACT','TIMEOUT'].includes(r.status)));
const mean=a=>a.reduce((a,b)=>a+b,0)/a.length;
const median=a=>{a=[...a].sort((a,b)=>a-b);return (a[(a.length-1)>>1]+a[a.length>>1])/2;};
const summary={};
for(const key of ['A','B','F']){
  const byLabel=Object.fromEntries(labels.map(label=>[label,rows.filter(r=>r.key===key&&r.label===label).sort((a,b)=>a.round-b.round)]));
  for(const rs of Object.values(byLabel)){assert.equal(rs.length,6);assert.deepEqual(rs.map(r=>r.round),[0,1,2,3,4,5]);}
  const stats={};
  for(const [label,rs] of Object.entries(byLabel)){
    const exact=rs.filter(r=>r.status==='EXACT');assert.ok(exact.every(r=>r.value===r.expectedValue));
    const wide=label==='modes-wide-helper'?1:label==='modes-wide-anchor'?0:-1;
    stats[label]={solved:exact.length,timeouts:rs.length-exact.length,
      medianSolveMs:exact.length?median(exact.map(r=>r.solveWallMs)):null,
      meanSolveMs:exact.length?mean(exact.map(r=>r.solveWallMs)):null,
      meanJoinedMs:mean(rs.map(r=>r.wallMs)),meanNodes:mean(rs.map(r=>r.nodes)),
      meanEvaluatorCycles:mean(rs.map(r=>Number(r.evaluatorCycles))),meanStrategistCycles:mean(rs.map(r=>Number(r.strategist.cycles))),
      meanProcessTotalCycles:mean(rs.map(r=>Number(r.processTotalCycles))),meanSharedHits:mean(rs.map(r=>r.cacheStats[0])),
      meanSharedStores:mean(rs.map(r=>r.cacheStats[1])),
      winners:exact.reduce((a,r)=>(a[r.winner]=(a[r.winner]??0)+1,a),{}),
      meanHorizonStops:wide<0?0:mean(rs.map(r=>r.evaluators[wide].result.metrics.horizonStops)),
      meanWideNodes:wide<0?null:mean(rs.map(r=>r.evaluators[wide].result.metrics.nodes)),
      meanDeepNodes:wide<0?null:mean(rs.map(r=>r.evaluators[wide^1].result.metrics.nodes))};
    if(label!==labels[0]&&exact.length===6&&byLabel[labels[0]].every(r=>r.status==='EXACT')){
      const ratios=rs.map((r,i)=>r.solveWallMs/byLabel[labels[0]][i].solveWallMs),m=mean(ratios),
        se=Math.sqrt(ratios.reduce((a,b)=>a+(b-m)**2,0)/5/6);
      stats[label].pairedTime={meanDeltaPct:100*(m-1),interval95Pct:[100*(m-2.571*se-1),100*(m+2.571*se-1)],ratios};
    }
  }
  summary[key]=stats;
}
writeFileSync(resolve(out,'summary.json'),JSON.stringify(summary,null,2)+'\n');console.log(JSON.stringify(summary,null,2));
