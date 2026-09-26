import {readFileSync} from 'node:fs';
const rows=process.argv.slice(2).flatMap(p=>readFileSync(p,'utf8').trim().split('\n').map(JSON.parse)).filter(r=>r.type==='trial');
const median=a=>{a.sort((a,b)=>a-b);const i=a.length>>>1;return a.length&1?a[i]:(a[i-1]+a[i])/2;};
const groups=new Map();
for(const r of rows){const k=`${r.fixture.columns}x${r.fixture.rows}/${r.fixture.moves.length} ${r.policy}/${r.cadenceMs}`;
  if(!groups.has(k))groups.set(k,[]);groups.get(k).push(r);}
for(const [key,rs] of groups){
  const good=rs.filter(r=>r.status==='EXACT');
  console.log(JSON.stringify({key,count:rs.length,exact:good.length,values:[...new Set(good.map(r=>r.value))],
    medianCycles:median(good.map(r=>Number(r.evaluatorCycles))),medianNodes:median(good.map(r=>r.nodes)),
    medianCyclesPerNode:median(good.map(r=>r.cyclesPerNode)),medianSolveMs:median(good.map(r=>r.solveWallMs)),
    minCycles:Math.min(...good.map(r=>Number(r.evaluatorCycles))),maxCycles:Math.max(...good.map(r=>Number(r.evaluatorCycles))),
    changes:rs.map(r=>r.evaluators.reduce((n,w)=>n+w.changes,0)),
    adaptiveExponents:[...new Set(rs.flatMap(r=>r.strategist?.trace.map(t=>t.exponent)??[]))],
    medianStrategistCycles:median(good.map(r=>Number(r.strategist.cycles))),
    medianCacheStats:[0,1,2].map(i=>median(good.map(r=>r.cacheStats[i]))),
    cleanup:rs.every(r=>r.cleanup)}));
}
