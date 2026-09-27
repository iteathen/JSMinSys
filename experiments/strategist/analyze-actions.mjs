import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const dir=process.argv[2];
if(!dir)throw Error('evidence directory required');
const median=a=>{const s=a.toSorted((x,y)=>x-y),i=s.length>>>1;return s.length&1?s[i]:(s[i-1]+s[i])/2;};
const summary=[];let count=0;
for(const file of ['screen','isolated']){
  const groups=new Map(),witnesses=new Map();
  const rows=readFileSync(join(dir,file+'.jsonl'),'utf8').trim().split('\n').map(JSON.parse).filter(r=>r.type==='trial');
  assert.equal(rows.length,file==='screen'?60:72);
  for(const r of rows){
    assert.equal(r.status,'EXACT');assert.equal(r.value,1);assert.equal(r.cleanup,true);
    assert.equal(r.errors.length,0);assert.equal(r.forcedTerminations,0);
    assert.equal(BigInt(r.evaluatorCycles),r.evaluators.reduce((n,e)=>n+BigInt(e.cycles),0n));
    assert.equal(r.nodes,r.evaluators.reduce((n,e)=>n+e.result.metrics.nodes,0));
    const root=r.fixture.moves.join('');
    for(const e of r.evaluators)if(e.result.status==='EXACT'){
      assert.equal(e.result.value,1);
      if(!witnesses.has(root))witnesses.set(root,e.result.move);
      assert.equal(e.result.move,witnesses.get(root));
    }
    const key=root+'/'+r.label;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);
  }
  count+=rows.length;
  for(const [key,rs] of groups){
    const patterns=[...new Set(rs.flatMap(r=>r.strategist?.trace.filter(t=>t.flags).map(t=>t.flags.join(','))??[]))];
    summary.push({file,key,count:rs.length,cycles:median(rs.map(r=>Number(r.evaluatorCycles))),
      nodes:median(rs.map(r=>r.nodes)),cyclesPerNode:median(rs.map(r=>r.cyclesPerNode)),
      solveMs:median(rs.map(r=>r.solveWallMs)),minCycles:Math.min(...rs.map(r=>Number(r.evaluatorCycles))),
      maxCycles:Math.max(...rs.map(r=>Number(r.evaluatorCycles))),
      strategistCycles:median(rs.map(r=>Number(r.strategist?.cycles??0))),
      settingChanges:rs.map(r=>r.evaluators.reduce((n,e)=>n+e.changes,0)),publishedPatterns:patterns});
  }
}
console.log(JSON.stringify({verified:count,summary},null,2));
